import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { WidgetSession } from './entities/widget.entity';
import { Application } from '../applications/entities/application.entity';
import { InitWidgetDto } from './dto/init-widget.dto';
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
    const { appId, clientId } = dto;

    const app = await this.applicationRepository.findOne({
      where: {
        id: appId,
        clientId,
        status: 'ACTIVE',
      },
    });
    if (!app) {
      throw new UnauthorizedException('Application not found or inactive');
    }

    if (!isOriginAllowed(origin, app.allowedDomains)) {
      throw new UnauthorizedException(
        'Origin not allowed to embed this widget',
      );
    }

    const session = this.widgetSessionRepository.create({
      tenantId: app.tenantId,
      applicationId: app.id,
      tokenHash: 'TEMP',
      origin,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const savedSession = await this.widgetSessionRepository.save(session);

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
