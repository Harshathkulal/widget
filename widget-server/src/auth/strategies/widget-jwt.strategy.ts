import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import * as crypto from 'crypto';
import { WidgetSession } from '../../widget/entities/widget.entity';

@Injectable()
export class WidgetJwtStrategy extends PassportStrategy(
  Strategy,
  'widget-jwt',
) {
  constructor(
    @InjectRepository(WidgetSession)
    private readonly widgetSessionRepository: Repository<WidgetSession>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
      ignoreExpiration: false,
      secretOrKey: process.env.WIDGET_JWT_SECRET || 'widget-secret-change-me',
    });
  }

  async validate(request: Request, payload: any) {
    if (
      !payload ||
      !payload.sub ||
      !payload.tenantId ||
      !payload.applicationId
    ) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (!token) {
      throw new UnauthorizedException('Missing widget token');
    }

    const session = await this.widgetSessionRepository.findOne({
      where: {
        id: payload.sub,
        isRevoked: false,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session is invalid or has been revoked');
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new UnauthorizedException('Session has expired');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const storedHash = Buffer.from(session.tokenHash, 'hex');
    const receivedHash = Buffer.from(tokenHash, 'hex');

    if (
      storedHash.length !== receivedHash.length ||
      !crypto.timingSafeEqual(storedHash, receivedHash)
    ) {
      throw new UnauthorizedException('Widget token does not match session');
    }

    return {
      sessionId: session.id,
      tenantId: payload.tenantId,
      applicationId: payload.applicationId,
    };
  }
}
