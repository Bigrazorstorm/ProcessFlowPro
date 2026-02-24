import { config } from 'dotenv';
import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcrypt';
import { Tenant, User, UserRole, Client, WorkflowTemplate, TemplateStep, WorkflowStepType } from '../entities';

config();

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Check if demo data already exists
    const existingTenant = await AppDataSource.getRepository(Tenant).findOne({
      where: { name: 'Demo Tenant' },
    });

    if (existingTenant) {
      console.log('⚠️  Demo data already exists, skipping seed');
      await AppDataSource.destroy();
      return;
    }

    // Create demo tenant
    const tenant = AppDataSource.getRepository(Tenant).create({
      name: 'Demo Tenant',
      plan: 'professional',
      settings: {
        timezone: 'Europe/Berlin',
        language: 'de',
      },
    });
    await AppDataSource.getRepository(Tenant).save(tenant);
    console.log('✅ Created demo tenant');

    // Create demo users
    const passwordHash = await bcrypt.hash('password123', 10);

    const ownerUser = AppDataSource.getRepository(User).create({
      tenantId: tenant.id,
      name: 'Max Mustermann',
      email: 'owner@example.com',
      passwordHash,
      role: UserRole.OWNER,
      capacityPointsLimit: 100,
      isActive: true,
    });
    await AppDataSource.getRepository(User).save(ownerUser);

    const seniorUser = AppDataSource.getRepository(User).create({
      tenantId: tenant.id,
      name: 'Erika Beispiel',
      email: 'senior@example.com',
      passwordHash,
      role: UserRole.SENIOR,
      capacityPointsLimit: 80,
      isActive: true,
    });
    await AppDataSource.getRepository(User).save(seniorUser);

    const accountantUser = AppDataSource.getRepository(User).create({
      tenantId: tenant.id,
      name: 'Hans Arbeiter',
      email: 'accountant@example.com',
      passwordHash,
      role: UserRole.ACCOUNTANT,
      capacityPointsLimit: 60,
      isActive: true,
    });
    await AppDataSource.getRepository(User).save(accountantUser);

    console.log('✅ Created 3 demo users (owner, senior, accountant)');

    // Create demo clients
    const client1 = AppDataSource.getRepository(Client).create({
      tenantId: tenant.id,
      name: 'Musterfirma GmbH',
      address: 'Musterstraße 1, 10115 Berlin',
      taxNumber: 'DE123456789',
      industry: 'Manufacturing',
      employeeCount: 25,
      reliabilityFactor: 1.0,
      primaryUserId: accountantUser.id,
      secondaryUserId: seniorUser.id,
      isActive: true,
    });
    await AppDataSource.getRepository(Client).save(client1);

    const client2 = AppDataSource.getRepository(Client).create({
      tenantId: tenant.id,
      name: 'Restaurant Zum Beispiel',
      address: 'Beispielplatz 5, 20095 Hamburg',
      taxNumber: 'DE987654321',
      industry: 'Gastronomy',
      employeeCount: 12,
      reliabilityFactor: 0.8,
      primaryUserId: accountantUser.id,
      isActive: true,
    });
    await AppDataSource.getRepository(Client).save(client2);

    console.log('✅ Created 2 demo clients');

    // Create demo workflow template
    const template = AppDataSource.getRepository(WorkflowTemplate).create({
      tenantId: tenant.id,
      name: 'Standard Payroll Workflow',
      industry: 'General',
      description: 'Standard monthly payroll processing workflow',
      isActive: true,
    });
    await AppDataSource.getRepository(WorkflowTemplate).save(template);

    // Create template steps
    const steps = [
      {
        name: 'Daten sammeln',
        type: WorkflowStepType.START,
        order: 1,
        description: 'Zeiterfassung und Änderungen sammeln',
        deadlineRule: { type: 'relative_workdays', value: 2 },
        assignedRole: UserRole.ACCOUNTANT,
      },
      {
        name: 'Abrechnung durchführen',
        type: WorkflowStepType.TASK,
        order: 2,
        description: 'Lohnabrechnung berechnen',
        deadlineRule: { type: 'relative_calendar_end', value: 0 },
        assignedRole: UserRole.ACCOUNTANT,
        estimationAllowed: true,
      },
      {
        name: 'Prüfung durch Senior',
        type: WorkflowStepType.APPROVAL,
        order: 3,
        description: 'Abrechnung von Senior Buchhalter überprüfen',
        deadlineRule: { type: 'relative_workdays', value: 3 },
        assignedRole: UserRole.SENIOR,
      },
      {
        name: 'Freigabe und Zahlung',
        type: WorkflowStepType.TASK,
        order: 4,
        description: 'Lohnzahlung durchführen',
        deadlineRule: { type: 'fixed_day_of_month', value: 25 },
        assignedRole: UserRole.OWNER,
      },
      {
        name: 'Abschluss',
        type: WorkflowStepType.END,
        order: 5,
        description: 'Lohnabrechnung abgeschlossen',
      },
    ];

    for (const stepData of steps) {
      const step = AppDataSource.getRepository(TemplateStep).create({
        templateId: template.id,
        ...stepData,
      });
      await AppDataSource.getRepository(TemplateStep).save(step);
    }

    console.log('✅ Created workflow template with 5 steps');
    console.log('');
    console.log('🌱 Seeding completed successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('  Owner: owner@example.com / password123');
    console.log('  Senior: senior@example.com / password123');
    console.log('  Accountant: accountant@example.com / password123');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
