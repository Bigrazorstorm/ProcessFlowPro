import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Client } from './client.entity';
import { WorkflowTemplate } from './workflow-template.entity';
import { WorkflowInstance } from './workflow-instance.entity';
import { AuditLog } from './audit-log.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 50, default: 'standard' })
  plan!: string;

  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => User, (user) => user.tenant, { cascade: true })
  users!: User[];

  @OneToMany(() => Client, (client) => client.tenant, { cascade: true })
  clients!: Client[];

  @OneToMany(() => WorkflowTemplate, (template) => template.tenant, { cascade: true })
  workflowTemplates!: WorkflowTemplate[];

  @OneToMany(() => WorkflowInstance, (instance) => instance.tenant)
  workflowInstances!: WorkflowInstance[];

  @OneToMany(() => AuditLog, (log) => log.tenant)
  auditLogs!: AuditLog[];
}
