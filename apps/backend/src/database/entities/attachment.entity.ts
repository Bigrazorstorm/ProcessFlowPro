import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('attachments')
@Index(['referenceType', 'referenceId'])
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  referenceType!: string; // 'workflow_step', 'ticket', 'step_comment'

  @Column({ type: 'uuid' })
  referenceId!: string;

  @Column({ type: 'varchar', length: 255 })
  filename!: string;

  @Column({ type: 'varchar', length: 500 })
  storagePath!: string; // S3 path or key

  @Column({ type: 'uuid', nullable: true })
  uploadedByUserId?: string;

  @Column({ type: 'integer' })
  fileSize!: number;

  @Column({ type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  checksum?: string;

  @CreateDateColumn()
  uploadedAt!: Date;

  // Relations - polymorphic reference
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploadedByUserId' })
  uploadedBy?: User;

  // Helper for polymorphic relation to WorkflowStep
  @ManyToOne('WorkflowStep', 'attachments', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referenceId' })
  referenceEntity: any;
}
