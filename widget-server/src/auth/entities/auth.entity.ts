import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

@Entity('auth_users')
@Index('idx_auth_users_tenant', ['tenantId'])
export class AuthUser extends BaseEntity {
  @Column('uuid', {
    name: 'tenant_id',
  })
  tenantId!: string;

  @Column('uuid', {
    name: 'application_id',
    nullable: true,
  })
  applicationId?: string;

  @Column({
    unique: true,
  })
  email!: string;

  @Column({
    name: 'password_hash',
  })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role!: UserRole;

  @Column({
    name: 'is_active',
    default: true,
  })
  isActive!: boolean;
}
