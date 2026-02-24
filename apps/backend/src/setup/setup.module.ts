import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';
import { User } from '../database/entities/user.entity';
import { Tenant } from '../database/entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tenant])],
  controllers: [SetupController],
  providers: [SetupService],
  exports: [SetupService],
})
export class SetupModule {}
