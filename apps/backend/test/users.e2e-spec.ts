import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/entities/user.entity';

describe('Users E2E', () => {
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
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'owner@test.com',
        password: 'TestPassword123',
      });

    ownerToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: 'newuser@test.com',
          name: 'New User',
          password: 'SecurePassword123',
          role: UserRole.ACCOUNTANT,
        });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('newuser@test.com');
      expect(res.body.name).toBe('New User');
      expect(res.body.role).toBe(UserRole.ACCOUNTANT);
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: 'dup@test.com',
          name: 'User 1',
          password: 'SecurePassword123',
          role: UserRole.ACCOUNTANT,
        });

      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: 'dup@test.com',
          name: 'User 2',
          password: 'SecurePassword123',
          role: UserRole.ACCOUNTANT,
        });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /users', () => {
    it('should list all users in tenant', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user', async () => {
      // First get users list
      const listRes = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${ownerToken}`);

      const userId = listRes.body[0].id;

      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Updated Name',
          capacityPointsLimit: 200,
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.capacityPointsLimit).toBe(200);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user', async () => {
      // Create a user first
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: 'todelete@test.com',
          name: 'To Delete',
          password: 'SecurePassword123',
          role: UserRole.TRAINEE,
        });

      const userId = createRes.body.id;

      const deleteRes = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify deletion
      const getRes = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(getRes.status).toBe(404);
    });
  });
});
