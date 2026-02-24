import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { WorkflowInstance } from './workflow-instance.entity';
import { TemplateStep } from './template-step.entity';
import { User } from './user.entity';
import { StepComment } from './step-comment.entity';
import { Attachment } from './attachment.entity';

export enum WorkflowStepStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_APPROVAL = 'pending_approval',
  DONE = 'done',
  SHIFTED = 'shifted',
  SKIPPED = 'skipped',
  REJECTED = 'rejected',
}

@Entity('workflow_steps')
@Index(['instanceId', 'status'])
@Index(['assignedUserId'])
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  instanceId!: string;

  @Column({ type: 'uuid' })
  templateStepId!: string;

  @Column({ type: 'enum', enum: WorkflowStepStatus, default: WorkflowStepStatus.OPEN })
  status!: WorkflowStepStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedUserId?: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'boolean', default: false })
  isEstimation!: boolean;

  @Column({ type: 'numeric', nullable: true })
  estimationValue?: number;

  @Column({ type: 'text', nullable: true })
  estimationReason?: string;

  @Column({ type: 'jsonb', default: [] })
  checklistProgress!: any[]; // Array of {itemId, checked}

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => WorkflowInstance, (instance) => instance.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instanceId' })
  instance!: WorkflowInstance;

  @ManyToOne(() => TemplateStep, (templateStep) => templateStep.workflowSteps)
  @JoinColumn({ name: 'templateStepId' })
  templateStep!: TemplateStep;

  @ManyToOne(() => User, (user) => user.assignedSteps, { nullable: true })
  @JoinColumn({ name: 'assignedUserId' })
  assignedUser?: User;

  @OneToMany(() => StepComment, (comment) => comment.step, { cascade: true })
  comments!: StepComment[];

  @OneToMany(() => Attachment, (attachment) => attachment.referenceEntity, { cascade: true })
  attachments!: Attachment[];
}
