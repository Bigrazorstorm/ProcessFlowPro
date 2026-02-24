import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tenant } from './tenant.entity';
import { WorkflowStep } from './workflow-step.entity';
import { StepComment } from './step-comment.entity';
import { AuditLog } from './audit-log.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  OWNER = 'owner',
  SENIOR = 'senior',
  ACCOUNTANT = 'accountant',
  TRAINEE = 'trainee',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'text' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ACCOUNTANT })
  role!: UserRole;

  @Column({ type: 'integer', default: 100 })
  capacityPointsLimit!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'uuid', nullable: true })
  primarySubstituteId?: string;

  @Column({ type: 'uuid', nullable: true })
  secondarySubstituteId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @OneToMany(() => WorkflowStep, (step) => step.assignedUser)
  assignedSteps!: WorkflowStep[];

  @OneToMany(() => StepComment, (comment) => comment.user)
  comments!: StepComment[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs!: AuditLog[];
}
