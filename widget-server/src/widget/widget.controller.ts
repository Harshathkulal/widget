import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Headers,
  Ip,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WidgetService } from './widget.service';
import { InitWidgetDto } from './dto/init-widget.dto';
import { WidgetAuthGuard } from '../auth/guards/widget-auth.guard';

@Controller('widget')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  @Post('init')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async init(
    @Body() initWidgetDto: InitWidgetDto,
    @Headers('origin') origin: string,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    const requestOrigin = origin;
    return this.widgetService.initSession(
      initWidgetDto,
      requestOrigin,
      userAgent,
      ip,
    );
  }

  @Post('revoke')
  @UseGuards(WidgetAuthGuard)
  async revoke(@Req() req: any) {
    await this.widgetService.revokeSession(req.user.sessionId);
    return { success: true };
  }
}
