import { AppDataSource } from '../data-source';
import { User, Tenant, UserRole } from '../entities';

async function createUser() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Check if tenant exists
    let tenant = await AppDataSource.getRepository(Tenant).findOne({
      where: { name: 'Demo Tenant' },
    });

    if (!tenant) {
      tenant = AppDataSource.getRepository(Tenant).create({
        name: 'Demo Tenant',
        plan: 'professional',
        settings: {
          timezone: 'Europe/Berlin',
          language: 'de',
        },
      });
      await AppDataSource.getRepository(Tenant).save(tenant);
      console.log('✅ Created demo tenant');
    } else {
      console.log('✅ Found existing tenant');
    }

    // Check if user already exists
    const existingUser = await AppDataSource.getRepository(User).findOne({
      where: { email: 'admin@example.com' },
    });

    if (existingUser) {
      console.log('⚠️  User admin@example.com already exists');
      await AppDataSource.destroy();
      return;
    }

    // Create admin user with plaintext password (will be hashed by entity)
    // Note: This uses a pre-generated bcrypt hash for "password123"
    const passwordHash = '$2b$10$e0MYzXyjpJS7Pd0RVvHwHe5Cw7dLhKX.5K9KvPG8wEZ9rHzPVm9Vy';
    
    const adminUser = AppDataSource.getRepository(User).create({
      tenantId: tenant.id,
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash,
      role: UserRole.OWNER,
      capacityPointsLimit: 100,
      isActive: true,
    });
    await AppDataSource.getRepository(User).save(adminUser);

    console.log('✅ Created admin user');
    console.log('');
    console.log('Login credentials:');
    console.log('  Email: admin@example.com');
    console.log('  Password: password123');
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

createUser();
