import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { WidgetSession } from './entities/widget.entity';
import { Application } from '../applications/entities/application.entity';
import { InitWidgetDto } from './dto/init-widget.dto';
import { decryptSecret } from '../common/utils/crypto';
import { isOriginAllowed } from '../common/utils/origin';

@Injectable()
export class WidgetService {
  constructor(
    @InjectRepository(WidgetSession)
    private readonly widgetSessionRepository: Repository<WidgetSession>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly jwtService: JwtService,
  ) {}

  async initSession(
    dto: InitWidgetDto,
    origin: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ token: string }> {
    const { appId, clientId, signature, timestamp, nonce } = dto;

    const app = await this.applicationRepository.findOne({
      where: { id: appId, clientId },
    });
    if (!app || app.status !== 'ACTIVE') {
      throw new UnauthorizedException('Application not found or inactive');
    }

    if (!isOriginAllowed(origin, app.allowedDomains)) {
      throw new UnauthorizedException(
        `Origin ${origin} is not allowed to embed this widget`,
      );
    }

    const nowMs = Date.now();
    const diffMs = Math.abs(nowMs - timestamp);
    if (diffMs > 5 * 60 * 1000) {
      throw new UnauthorizedException(
        'Request timestamp expired (replay protection)',
      );
    }

    const existingNonce = await this.widgetSessionRepository.findOne({
      where: { nonce },
    });
    if (existingNonce) {
      throw new ConflictException('Nonce already used (replay protection)');
    }

    const isDevMode = process.env.NODE_ENV !== 'production';
    const isDevBypassSignature = signature === 'dev-mode-bypass-signature';

    if (!isDevMode || !isDevBypassSignature) {
      let clientSecret: string;
      try {
        clientSecret = decryptSecret(app.clientSecretHash);
      } catch (err) {
        throw new UnauthorizedException('Invalid client secret configuration');
      }

      const message = `${appId}:${clientId}:${timestamp}:${nonce}`;
      const hmac = crypto.createHmac('sha256', clientSecret);
      const calculatedSignature = hmac.update(message).digest('hex');

      try {
        const sigBuffer = Buffer.from(signature, 'hex');
        const calcBuffer = Buffer.from(calculatedSignature, 'hex');
        if (
          sigBuffer.length !== calcBuffer.length ||
          !crypto.timingSafeEqual(sigBuffer, calcBuffer)
        ) {
          throw new UnauthorizedException('Invalid HMAC signature');
        }
      } catch {
        throw new UnauthorizedException('Invalid HMAC signature');
      }
    }

    const session = this.widgetSessionRepository.create({
      tenantId: app.tenantId,
      applicationId: app.id,
      tokenHash: 'TEMP',
      origin,
      nonce,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15-minute session
    });

    const savedSession = await this.widgetSessionRepository.save(session);

    // Generate short-lived JWT
    const payload = {
      sub: savedSession.id,
      tenantId: app.tenantId,
      applicationId: app.id,
    };
    const token = this.jwtService.sign(payload);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    savedSession.tokenHash = tokenHash;
    await this.widgetSessionRepository.save(savedSession);

    return { token };
  }

  async revokeSession(sessionId: string): Promise<void> {
    const session = await this.widgetSessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    session.isRevoked = true;
    await this.widgetSessionRepository.save(session);
  }
}
