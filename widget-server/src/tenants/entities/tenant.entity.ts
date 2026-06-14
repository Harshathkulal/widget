import { Entity, Column, DeleteDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @Column({
    name: 'contact_email',
    nullable: true,
  })
  contactEmail?: string;

  @Column({
    default: 'free',
  })
  plan!: string;

  @Column({
    default: 'ACTIVE',
  })
  status!: string;

  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt?: Date;
}
