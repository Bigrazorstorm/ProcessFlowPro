import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowInstance } from '../database/entities/workflow-instance.entity';
import { WorkflowStep } from '../database/entities/workflow-step.entity';
import { User } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';
import { AiSuggestionsService } from './ai-suggestions.service';
import { AiSuggestionsController } from './ai-suggestions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkflowInstance, WorkflowStep, User, Client])],
  controllers: [AiSuggestionsController],
  providers: [AiSuggestionsService],
})
export class AiSuggestionsModule {}
