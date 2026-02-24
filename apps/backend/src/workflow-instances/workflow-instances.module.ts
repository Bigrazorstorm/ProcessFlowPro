import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { WorkflowInstance } from '../database/entities/workflow-instance.entity';
import { WorkflowStep } from '../database/entities/workflow-step.entity';
import { WorkflowTemplate } from '../database/entities/workflow-template.entity';
import { Client } from '../database/entities/client.entity';
import { WorkflowInstancesService } from './workflow-instances.service';
import { WorkflowInstancesController } from './workflow-instances.controller';
import { WorkflowInstancesProcessor } from './workflow-instances.processor';
import { AuthModule } from '../auth/auth.module';
import { DeadlineCalculatorModule } from '../deadline-calculator/deadline-calculator.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowInstance, WorkflowStep, WorkflowTemplate, Client]),
    BullModule.registerQueue({
      name: 'workflow-instances',
    }),
    AuthModule,
    DeadlineCalculatorModule,
  ],
  controllers: [WorkflowInstancesController],
  providers: [WorkflowInstancesService, WorkflowInstancesProcessor],
  exports: [WorkflowInstancesService],
})
export class WorkflowInstancesModule {}
