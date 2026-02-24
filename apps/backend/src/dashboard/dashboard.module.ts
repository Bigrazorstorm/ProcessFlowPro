import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowInstance } from '../database/entities/workflow-instance.entity';
import { WorkflowStep } from '../database/entities/workflow-step.entity';
import { WorkflowTemplate } from '../database/entities/workflow-template.entity';
import { User } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowInstance,
      WorkflowStep,
      WorkflowTemplate,
      User,
      Client,
    ]),
    AuthModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
