import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('audit_logs')
@Index('idx_audit_tenant_entity', ['tenantId', 'entityType', 'entityId'])
@Index('idx_audit_tenant', ['tenantId'])
export class AuditLog extends BaseEntity {
  @Column('uuid', {
    name: 'tenant_id',
  })
  tenantId!: string;

  @Column('uuid', {
    name: 'application_id',
  })
  applicationId!: string;

  @Column({
    name: 'entity_type',
  })
  entityType!: string;

  @Column({
    name: 'entity_id',
  })
  entityId!: string;

  @Column()
  action!: string;

  @Column({
    type: 'jsonb',
    name: 'old_value',
    nullable: true,
  })
  oldValue?: Record<string, unknown>;

  @Column({
    type: 'jsonb',
    name: 'new_value',
    nullable: true,
  })
  newValue?: Record<string, unknown>;

  @Column({
    name: 'performed_by',
  })
  performedBy!: string;

  @Column({
    name: 'ip_address',
    nullable: true,
  })
  ipAddress?: string;
}
