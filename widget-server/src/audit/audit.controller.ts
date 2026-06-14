import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { WidgetAuthGuard } from '../auth/guards/widget-auth.guard';

@Controller('widget/audit')
@UseGuards(WidgetAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get(':entityType/:entityId')
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Req() req: any,
  ) {
    const { tenantId, applicationId } = req.user;
    return this.auditService.findByEntity(
      tenantId,
      applicationId,
      entityType,
      entityId,
    );
  }
}
