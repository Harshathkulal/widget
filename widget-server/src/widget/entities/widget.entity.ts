import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('widget_sessions')
@Index('idx_widget_sessions_token', ['tokenHash'])
@Index('idx_widget_sessions_app', ['applicationId'])
export class WidgetSession extends BaseEntity {
  @Column('uuid', {
    name: 'tenant_id',
  })
  tenantId!: string;

  @Column('uuid', {
    name: 'application_id',
  })
  applicationId!: string;

  @Column({
    name: 'token_hash',
  })
  tokenHash!: string;

  @Column()
  origin!: string;

  @Column({
    unique: true,
  })
  nonce!: string;

  @Column({
    name: 'is_revoked',
    default: false,
  })
  isRevoked!: boolean;

  @Column({
    name: 'user_agent',
    nullable: true,
  })
  userAgent?: string;

  @Column({
    name: 'ip_address',
    nullable: true,
  })
  ipAddress?: string;

  @Column({
    type: 'timestamp',
    name: 'expires_at',
  })
  expiresAt!: Date;
}
