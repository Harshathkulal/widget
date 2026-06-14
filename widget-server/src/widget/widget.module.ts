import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { WidgetService } from './widget.service';
import { WidgetController } from './widget.controller';
import { WidgetSession } from './entities/widget.entity';
import { Application } from '../applications/entities/application.entity';
import { WidgetJwtStrategy } from '../auth/strategies/widget-jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([WidgetSession, Application]),
    JwtModule.register({
      secret: process.env.WIDGET_JWT_SECRET,
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  controllers: [WidgetController],
  providers: [WidgetService, WidgetJwtStrategy],
  exports: [WidgetService],
})
export class WidgetModule {}
