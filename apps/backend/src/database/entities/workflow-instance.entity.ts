import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Tenant } from './tenant.entity';
import { Client } from './client.entity';
import { WorkflowTemplate } from './workflow-template.entity';
import { WorkflowStep } from './workflow-step.entity';

export enum WorkflowInstanceStatus {
  ACTIVE = 'active',
  DELAYED = 'delayed',
  CRITICAL = 'critical',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Entity('workflow_instances')
@Index(['tenantId', 'clientId', 'periodYear', 'periodMonth'], { unique: true })
@Index(['tenantId', 'status'])
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  clientId!: string;

  @Column({ type: 'uuid' })
  templateId!: string;

  @Column({ type: 'integer' })
  periodYear!: number;

  @Column({ type: 'integer' })
  periodMonth!: number;

  @Column({ type: 'enum', enum: WorkflowInstanceStatus, default: WorkflowInstanceStatus.ACTIVE })
  status!: WorkflowInstanceStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.workflowInstances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => Client, (client) => client.workflowInstances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client!: Client;

  @ManyToOne(() => WorkflowTemplate)
  @JoinColumn({ name: 'templateId' })
  template!: WorkflowTemplate;

  @OneToMany(() => WorkflowStep, (step) => step.instance, { cascade: true })
  steps!: WorkflowStep[];
}
