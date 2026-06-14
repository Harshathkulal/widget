import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(params: {
    tenantId: string;
    applicationId: string;
    entityType: string;
    entityId: string;
    action: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    performedBy: string;
    ipAddress?: string;
  }): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(params);
    return this.auditLogRepository.save(auditLog);
  }

  async findByEntity(
    tenantId: string,
    applicationId: string,
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        tenantId,
        applicationId,
        entityType,
        entityId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAll(
    tenantId: string,
    applicationId: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.auditLogRepository.findAndCount({
      where: {
        tenantId,
        applicationId,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
