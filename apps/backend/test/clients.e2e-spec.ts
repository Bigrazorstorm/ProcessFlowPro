import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/entities/user.entity';

describe('Clients E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ownerUser: User;
  let ownerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    // Clean up and setup test data
    const userRepo = dataSource.getRepository(User);
    await userRepo.delete({});

    // Create owner user for testing
    const passwordHash = await bcrypt.hash('TestPassword123', 10);
    ownerUser = userRepo.create({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'owner@test.com',
      name: 'Test Owner',
      passwordHash,
      role: UserRole.OWNER,
      tenantId: '00000000-0000-0000-0000-000000000001',
      isActive: true,
    });
    await userRepo.save(ownerUser);

    // Login to get token
    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'owner@test.com',
      password: 'TestPassword123',
    });

    ownerToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /clients', () => {
    it('should create a new client', async () => {
      const res = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Test Company GmbH',
          address: '123 Main Street',
          industry: 'Manufacturing',
          employeeCount: 50,
          reliabilityFactor: 0.95,
          taxNumber: 'DE123456789',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test Company GmbH');
      expect(res.body.industry).toBe('Manufacturing');
      expect(res.body.employeeCount).toBe(50);
    });

    it('should reject duplicate client name in tenant', async () => {
      await request(app.getHttpServer()).post('/clients').set('Authorization', `Bearer ${ownerToken}`).send({
        name: 'Unique Company',
        industry: 'Tech',
        employeeCount: 20,
      });

      const res = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Unique Company',
          industry: 'Finance',
          employeeCount: 30,
        });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /clients', () => {
    it('should list all clients in tenant', async () => {
      const res = await request(app.getHttpServer()).get('/clients').set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('PATCH /clients/:id', () => {
    it('should update client', async () => {
      // First create a client
      const createRes = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Update Test Client',
          industry: 'Retail',
          employeeCount: 15,
        });

      const clientId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .patch(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Updated Client Name',
          employeeCount: 25,
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Client Name');
      expect(res.body.employeeCount).toBe(25);
    });
  });

  describe('DELETE /clients/:id', () => {
    it('should delete client (OWNER only)', async () => {
      // Create a client
      const createRes = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'To Delete Client',
          industry: 'Services',
          employeeCount: 10,
        });

      const clientId = createRes.body.id;

      const deleteRes = await request(app.getHttpServer())
        .delete(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify deletion
      const getRes = await request(app.getHttpServer())
        .get(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(getRes.status).toBe(404);
    });
  });
});
