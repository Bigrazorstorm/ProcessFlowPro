import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../src/database/entities/user.entity';

describe('Auth E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    // Setup test user
    const userRepo = dataSource.getRepository(User);
    await userRepo.delete({});

    const passwordHash = await bcrypt.hash('TestPassword123', 10);
    await userRepo.save(
      userRepo.create({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'auth@test.com',
        name: 'Auth Test Owner',
        passwordHash,
        role: UserRole.OWNER,
        tenantId: '00000000-0000-0000-0000-000000000001',
        isActive: true,
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials and return tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'auth@test.com', password: 'TestPassword123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toMatchObject({
        email: 'auth@test.com',
        name: 'Auth Test Owner',
        role: UserRole.OWNER,
      });
    });

    it('should reject invalid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'auth@test.com', password: 'WrongPassword' });

      expect(res.status).toBe(401);
    });

    it('should reject unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'unknown@test.com', password: 'TestPassword123' });

      expect(res.status).toBe(401);
    });

    it('should reject missing credentials', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /auth/me', () => {
    let token: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'auth@test.com', password: 'TestPassword123' });
      token = loginRes.body.accessToken;
    });

    it('should return current user info', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('auth@test.com');
    });

    it('should reject request without token', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');

      expect(res.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me').set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should issue new access token from valid refresh token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'auth@test.com', password: 'TestPassword123' });

      const { refreshToken } = loginRes.body;

      const res = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' });

      expect(res.status).toBe(401);
    });
  });
});
