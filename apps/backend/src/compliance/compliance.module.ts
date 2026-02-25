import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { User, Client, AuditLog, WorkflowInstance, WorkflowStep, StepComment } from '@/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Client, AuditLog, WorkflowInstance, WorkflowStep, StepComment])],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
