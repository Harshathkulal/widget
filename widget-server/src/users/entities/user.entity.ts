import { Entity, Column, DeleteDateColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('users')
@Unique('uq_users_tenant_app_email', ['tenantId', 'applicationId', 'email'])
@Index('idx_users_tenant_app', ['tenantId', 'applicationId'])
export class User extends BaseEntity {
  @Column('uuid', {
    name: 'tenant_id',
  })
  tenantId!: string;

  @Column('uuid', {
    name: 'application_id',
  })
  applicationId!: string;

  @Column({
    name: 'first_name',
  })
  firstName!: string;

  @Column({
    name: 'last_name',
  })
  lastName!: string;

  @Column()
  email!: string;

  @Column({
    default: 'ACTIVE',
  })
  status!: string;

  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt?: Date;
}
