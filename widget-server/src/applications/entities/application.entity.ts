import { Entity, Column, Index, DeleteDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('applications')
@Index('idx_applications_tenant', ['tenantId'])
export class Application extends BaseEntity {
  @Column('uuid', {
    name: 'tenant_id',
  })
  tenantId!: string;

  @Column({
    name: 'app_name',
  })
  appName!: string;

  @Column({
    name: 'client_id',
    unique: true,
  })
  clientId!: string;

  @Column({
    name: 'client_secret_hash',
  })
  clientSecretHash!: string;

  @Column('text', {
    name: 'allowed_domains',
    array: true,
    default: '{}',
  })
  allowedDomains!: string[];

  @Column({
    default: 'ACTIVE',
  })
  status!: string;

  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt?: Date;
}
