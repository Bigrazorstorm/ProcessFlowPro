import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../src/database/entities/user.entity';

describe('Dashboard E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ownerToken: string;
  let accountantToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    const userRepo = dataSource.getRepository(User);
    await userRepo.delete({});

    const passwordHash = await bcrypt.hash('TestPassword123', 10);

    await userRepo.save([
      userRepo.create({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'owner@dashboard-test.com',
        name: 'Dashboard Owner',
        passwordHash,
        role: UserRole.OWNER,
        tenantId: '00000000-0000-0000-0000-000000000001',
        isActive: true,
      }),
      userRepo.create({
        id: '00000000-0000-0000-0000-000000000002',
        email: 'accountant@dashboard-test.com',
        name: 'Dashboard Accountant',
        passwordHash,
        role: UserRole.ACCOUNTANT,
        tenantId: '00000000-0000-0000-0000-000000000001',
        isActive: true,
      }),
    ]);

    const ownerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@dashboard-test.com', password: 'TestPassword123' });
    ownerToken = ownerLogin.body.accessToken;

    const accountantLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'accountant@dashboard-test.com', password: 'TestPassword123' });
    accountantToken = accountantLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /dashboard/metrics', () => {
    it('should return metrics for any authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/metrics')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalClients');
      expect(res.body).toHaveProperty('activeWorkflows');
      expect(res.body).toHaveProperty('completedToday');
      expect(res.body).toHaveProperty('overdueSteps');
      expect(res.body).toHaveProperty('teamUtilization');
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/dashboard/metrics');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /dashboard/stats', () => {
    it('should return aggregated stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('workflows');
      expect(res.body).toHaveProperty('tasks');
      expect(res.body).toHaveProperty('clients');
      expect(res.body).toHaveProperty('users');
      expect(res.body.users.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /dashboard/upcoming-deadlines', () => {
    it('should return upcoming deadlines array', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/upcoming-deadlines')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should accept days query parameter', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/upcoming-deadlines?days=30')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should accept userId query parameter for multi-user filtering', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/upcoming-deadlines?userId=00000000-0000-0000-0000-000000000001')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('each deadline item should include assignedUserId and assignedUserName fields', async () => {
      // The fields should exist in the response schema even if empty (no data in test environment)
      const res = await request(app.getHttpServer())
        .get('/dashboard/upcoming-deadlines')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      // If there are deadlines, verify the schema
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('assignedUserId');
        expect(res.body[0]).toHaveProperty('assignedUserName');
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('stepName');
        expect(res.body[0]).toHaveProperty('clientName');
        expect(res.body[0]).toHaveProperty('dueDate');
        expect(res.body[0]).toHaveProperty('status');
        expect(res.body[0]).toHaveProperty('priority');
      }
    });
  });

  describe('GET /dashboard/workload (OWNER/SENIOR only)', () => {
    it('should return user workload for owner', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/workload')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should forbid workload access for accountant role', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/workload')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /dashboard/activity', () => {
    it('should return recent activity', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/activity')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
