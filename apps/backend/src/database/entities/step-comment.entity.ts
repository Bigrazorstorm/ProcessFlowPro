import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WorkflowStep } from './workflow-step.entity';
import { User } from './user.entity';

@Entity('step_comments')
export class StepComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  stepId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => WorkflowStep, (step) => step.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stepId' })
  step!: WorkflowStep;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'userId' })
  user!: User;
}
