import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowStep } from '../database/entities/workflow-step.entity';
import { WorkflowInstance } from '../database/entities/workflow-instance.entity';
import { User } from '../database/entities/user.entity';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowStep, WorkflowInstance, User]),
    EmailModule,
    NotificationsModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
