import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { WorkflowInstance } from '../database/entities/workflow-instance.entity';
import { WorkflowStep } from '../database/entities/workflow-step.entity';
import { User } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';
import { WorkflowTemplate } from '../database/entities/workflow-template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowInstance,
      WorkflowStep,
      User,
      Client,
      WorkflowTemplate,
    ]),
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
