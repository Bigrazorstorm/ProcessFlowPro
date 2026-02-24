import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, UserRole } from '../database/entities/user.entity';
import { Tenant } from '../database/entities/tenant.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SetupService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async getSetupStatus() {
    try {
      // Check database connection
      const isConnected = this.dataSource.isInitialized;
      
      // Check if any users exist
      const userCount = await this.usersRepository.count();
      const tenantCount = await this.tenantsRepository.count();

      return {
        status: 'ok',
        database: {
          connected: isConnected,
          initialized: userCount > 0,
        },
        data: {
          tenants: tenantCount,
          users: userCount,
          needsSetup: userCount === 0,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'error',
        message,
        needsSetup: true,
      };
    }
  }

  async initializeSystem() {
    try {
      // Check if already initialized
      const userCount = await this.usersRepository.count();
      if (userCount > 0) {
        return {
          success: false,
          message: 'System is already initialized',
        };
      }

      // Create default tenant
      let tenant: Tenant | null = await this.tenantsRepository.findOne({ where: { name: 'Demo Tenant' } });
      if (!tenant) {
        const tenantData = {
          name: 'Demo Tenant',
          plan: 'professional',
          settings: {
            timezone: 'Europe/Berlin',
            language: 'de',
          },
        };
        tenant = this.tenantsRepository.create(tenantData as any);
        tenant = await this.tenantsRepository.save(tenant);
      }

      if (!tenant) {
        throw new Error('Failed to create tenant');
      }

      // Create default admin user
      const hashedPassword = await bcrypt.hash('password', 10);
      const adminUserData = {
        email: 'owner@demo.com',
        name: 'Demo Owner',
        passwordHash: hashedPassword,
        role: UserRole.OWNER,
        tenantId: tenant.id,
        capacityPointsLimit: 100,
        isActive: true,
      };
      const adminUser = this.usersRepository.create(adminUserData as any);
      await this.usersRepository.save(adminUser);

      // Create additional demo users
      const demoUsers = [
        { email: 'senior@demo.com', name: 'Demo Senior', role: UserRole.SENIOR },
        { email: 'accountant@demo.com', name: 'Demo Accountant', role: UserRole.ACCOUNTANT },
        { email: 'trainee@demo.com', name: 'Demo Trainee', role: UserRole.TRAINEE },
      ];

      for (const userData of demoUsers) {
        const userData2 = {
          email: userData.email,
          name: userData.name,
          passwordHash: hashedPassword,
          role: userData.role,
          tenantId: tenant.id,
          capacityPointsLimit: 80,
          isActive: true,
        };
        const user = this.usersRepository.create(userData2 as any);
        await this.usersRepository.save(user);
      }

      return {
        success: true,
        message: 'System initialized successfully',
        credentials: {
          email: 'owner@demo.com',
          password: 'password',
          hint: 'Use these credentials to log in',
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(`Setup failed: ${message}`);
    }
  }
}
