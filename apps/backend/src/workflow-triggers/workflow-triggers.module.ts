import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkflowTriggersService } from './workflow-triggers.service';
import { WorkflowTriggersController } from './workflow-triggers.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [WorkflowTriggersController],
  providers: [WorkflowTriggersService],
  exports: [WorkflowTriggersService],
})
export class WorkflowTriggersModule {}
