import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import {
  Tenant,
  User,
  Client,
  WorkflowTemplate,
  TemplateStep,
  WorkflowInstance,
  WorkflowStep,
  StepComment,
  Attachment,
  AuditLog,
} from '@/database/entities';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { WorkflowTemplatesModule } from './workflow-templates/workflow-templates.module';
import { DeadlineCalculatorModule } from './deadline-calculator/deadline-calculator.module';
import { WorkflowInstancesModule } from './workflow-instances/workflow-instances.module';
import { WorkflowExecutionModule } from './workflow-execution/workflow-execution.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportingModule } from './reporting/reporting.module';
import { SetupModule } from './setup/setup.module';
import { LoggerModule } from './common/logger';
import { ComplianceModule } from './compliance/compliance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [Tenant, User, Client, WorkflowTemplate, TemplateStep, WorkflowInstance, WorkflowStep, StepComment, Attachment, AuditLog],
        migrations: ['dist/database/migrations/*.js'],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          db: configService.get('REDIS_DB', 0),
        },
      }),
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    WorkflowTemplatesModule,
    DeadlineCalculatorModule,
    WorkflowInstancesModule,
    WorkflowExecutionModule,
    DashboardModule,
    NotificationsModule,
    ReportingModule,
    SetupModule,
    LoggerModule,
    ComplianceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
