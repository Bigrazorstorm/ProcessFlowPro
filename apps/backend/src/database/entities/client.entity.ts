import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';
import { WorkflowInstance } from './workflow-instance.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxNumber?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  companyNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry?: string;

  @Column({ type: 'integer', default: 1 })
  employeeCount!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  reliabilityFactor!: number;

  @Column({ type: 'uuid', nullable: true })
  primaryUserId?: string;

  @Column({ type: 'uuid', nullable: true })
  secondaryUserId?: string;

  @Column({ type: 'jsonb', default: [] })
  specialties!: any[];

  @Column({ type: 'jsonb', default: [] })
  contacts!: any[];

  @Column({ type: 'jsonb', nullable: true })
  taxAdvisorContact?: any;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.clients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'primaryUserId' })
  primaryUser?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'secondaryUserId' })
  secondaryUser?: User;

  @OneToMany(() => WorkflowInstance, (instance) => instance.client)
  workflowInstances!: WorkflowInstance[];
}
