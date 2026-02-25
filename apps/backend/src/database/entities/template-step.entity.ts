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
import { WorkflowTemplate } from './workflow-template.entity';
import { WorkflowStep } from './workflow-step.entity';

export enum WorkflowStepType {
  START = 'start',
  END = 'end',
  TASK = 'task',
  DECISION = 'decision',
  PARALLEL_GATEWAY = 'parallel_gateway',
  SYNC_GATEWAY = 'sync_gateway',
  EVENT = 'event',
  SUBPROCESS = 'subprocess',
  FORM_INPUT = 'form_input',
  NOTIFICATION = 'notification',
  APPROVAL = 'approval',
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  OWNER = 'owner',
  SENIOR = 'senior',
  ACCOUNTANT = 'accountant',
  TRAINEE = 'trainee',
}

@Entity('template_steps')
export class TemplateStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  templateId!: string;

  @Column({ type: 'enum', enum: WorkflowStepType, default: WorkflowStepType.TASK })
  type!: WorkflowStepType;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'integer' })
  order!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: [] })
  checklist!: any[]; // Array of {id, text, required}

  @Column({ type: 'text', nullable: true })
  tips?: string;

  @Column({ type: 'jsonb', default: [] })
  errors!: string[];

  @Column({ type: 'jsonb', nullable: true })
  deadlineRule?: any; // {type, value, ...}

  @Column({ type: 'enum', enum: UserRole, nullable: true })
  assignedRole?: UserRole;

  @Column({ type: 'boolean', default: false })
  estimationAllowed!: boolean;

  @Column({ type: 'boolean', default: false })
  blocksNext!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => WorkflowTemplate, (template) => template.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template!: WorkflowTemplate;

  @OneToMany(() => WorkflowStep, (step) => step.templateStep)
  workflowSteps!: WorkflowStep[];
}
