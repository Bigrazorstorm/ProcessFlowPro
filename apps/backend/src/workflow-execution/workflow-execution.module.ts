import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowStep } from '../database/entities/workflow-step.entity';
import { StepComment } from '../database/entities/step-comment.entity';
import { WorkflowInstance } from '../database/entities/workflow-instance.entity';
import { User } from '../database/entities/user.entity';
import { WorkflowExecutionService } from './workflow-execution.service';
import { WorkflowExecutionController } from './workflow-execution.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowStep, StepComment, WorkflowInstance, User]),
    AuthModule,
  ],
  controllers: [WorkflowExecutionController],
  providers: [WorkflowExecutionService],
  exports: [WorkflowExecutionService],
})
export class WorkflowExecutionModule {}
