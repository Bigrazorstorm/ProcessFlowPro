import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../src/database/entities/user.entity';

describe('Notifications E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ownerToken: string;

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
    await userRepo.save(
      userRepo.create({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'owner@notifications-test.com',
        name: 'Notifications Owner',
        passwordHash,
        role: UserRole.OWNER,
        tenantId: '00000000-0000-0000-0000-000000000001',
        isActive: true,
      }),
    );

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@notifications-test.com', password: 'TestPassword123' });
    ownerToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /notifications', () => {
    it('should return an empty array for a new user', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /notifications/unread/count', () => {
    it('should return unread count of 0 for new user', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications/unread/count')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('unreadCount');
      expect(res.body.unreadCount).toBe(0);
    });
  });

  describe('GET /notifications/preferences', () => {
    it('should return default notification preferences', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications/preferences')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('emailOnStepAssigned');
      expect(res.body).toHaveProperty('emailOnDeadlineApproaching');
      expect(res.body).toHaveProperty('digestFrequency');
      expect(res.body.emailOnStepAssigned).toBe(true);
      expect(res.body.digestFrequency).toBe('immediate');
    });
  });

  describe('PATCH /notifications/preferences', () => {
    it('should update notification preferences', async () => {
      const res = await request(app.getHttpServer())
        .patch('/notifications/preferences')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ emailOnStepAssigned: false, digestFrequency: 'daily' });

      expect(res.status).toBe(200);
      expect(res.body.emailOnStepAssigned).toBe(false);
      expect(res.body.digestFrequency).toBe('daily');
    });

    it('should keep unspecified preferences unchanged', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications/preferences')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.emailOnDeadlineApproaching).toBe(true);
    });
  });

  describe('POST /notifications/read-all', () => {
    it('should mark all notifications as read and return count', async () => {
      const res = await request(app.getHttpServer())
        .post('/notifications/read-all')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('markedAsReadCount');
      expect(res.body.markedAsReadCount).toBe(0);
    });
  });

  describe('POST /notifications/clear-old', () => {
    it('should clear old notifications and return count', async () => {
      const res = await request(app.getHttpServer())
        .post('/notifications/clear-old')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('clearedCount');
      expect(res.body.clearedCount).toBe(0);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should return "Notification not found" for unknown id', async () => {
      const res = await request(app.getHttpServer())
        .patch('/notifications/nonexistent-id/read')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toBe('Notification not found');
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should return deleted=false for unknown notification', async () => {
      const res = await request(app.getHttpServer())
        .delete('/notifications/nonexistent-id')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(false);
      expect(res.body.message).toBe('Notification not found');
    });
  });
});
