import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../src/database/entities/user.entity';
import { WorkflowStepType } from '../src/database/entities/template-step.entity';

describe('Workflow Instances E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ownerToken: string;
  let seniorToken: string;
  let accountantToken: string;
  let templateId: string;
  let clientId: string;

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
        email: 'owner@instances-test.com',
        name: 'Instances Owner',
        passwordHash,
        role: UserRole.OWNER,
        tenantId: '00000000-0000-0000-0000-000000000001',
        isActive: true,
      }),
      userRepo.create({
        id: '00000000-0000-0000-0000-000000000002',
        email: 'senior@instances-test.com',
        name: 'Instances Senior',
        passwordHash,
        role: UserRole.SENIOR,
        tenantId: '00000000-0000-0000-0000-000000000001',
        isActive: true,
      }),
      userRepo.create({
        id: '00000000-0000-0000-0000-000000000003',
        email: 'accountant@instances-test.com',
        name: 'Instances Accountant',
        passwordHash,
        role: UserRole.ACCOUNTANT,
        tenantId: '00000000-0000-0000-0000-000000000001',
        isActive: true,
      }),
    ]);

    const ownerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@instances-test.com', password: 'TestPassword123' });
    ownerToken = ownerLogin.body.accessToken;

    const seniorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'senior@instances-test.com', password: 'TestPassword123' });
    seniorToken = seniorLogin.body.accessToken;

    const accountantLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'accountant@instances-test.com', password: 'TestPassword123' });
    accountantToken = accountantLogin.body.accessToken;

    // Create a client for use in instance tests
    const clientRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Test Client GmbH', industry: 'Finance', employeeCount: 10 });
    clientId = clientRes.body.id;

    // Create a template for use in instance tests
    const templateRes = await request(app.getHttpServer())
      .post('/workflow-templates')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Payroll Template',
        industry: 'Finance',
        steps: [
          { type: WorkflowStepType.START, name: 'Start', estimationAllowed: false },
          { type: WorkflowStepType.TASK, name: 'Process', estimationAllowed: true },
          { type: WorkflowStepType.END, name: 'End', estimationAllowed: false },
        ],
      });
    templateId = templateRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /workflow-instances', () => {
    it('should return a list of instances for any authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/workflow-instances')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/workflow-instances');
      expect(res.status).toBe(401);
    });

    it('should support pagination via page and limit query params', async () => {
      const res = await request(app.getHttpServer())
        .get('/workflow-instances?page=1&limit=5')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /workflow-instances', () => {
    it('should create a new workflow instance (OWNER)', async () => {
      const res = await request(app.getHttpServer())
        .post('/workflow-instances')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ templateId, clientId });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.templateId).toBe(templateId);
      expect(res.body.clientId).toBe(clientId);
      expect(res.body.status).toBe('active');
    });

    it('should create a new workflow instance (SENIOR)', async () => {
      // Create a second client to avoid the unique constraint (tenantId, clientId, periodYear, periodMonth)
      const secondClientRes = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Senior Client GmbH', industry: 'Tech', employeeCount: 5 });
      const secondClientId = secondClientRes.body.id;

      const res = await request(app.getHttpServer())
        .post('/workflow-instances')
        .set('Authorization', `Bearer ${seniorToken}`)
        .send({ templateId, clientId: secondClientId });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    it('should reject instance creation for ACCOUNTANT role', async () => {
      const res = await request(app.getHttpServer())
        .post('/workflow-instances')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({ templateId, clientId });

      expect(res.status).toBe(403);
    });

    it('should return 404 for unknown templateId', async () => {
      const fakeTemplateId = '00000000-0000-0000-0000-999999999999';
      const res = await request(app.getHttpServer())
        .post('/workflow-instances')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ templateId: fakeTemplateId, clientId });

      expect(res.status).toBe(404);
    });

    it('should return 404 for unknown clientId', async () => {
      const fakeClientId = '00000000-0000-0000-0000-999999999998';
      const res = await request(app.getHttpServer())
        .post('/workflow-instances')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ templateId, clientId: fakeClientId });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /workflow-instances/:id', () => {
    let instanceId: string;

    beforeAll(async () => {
      const clientRes = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Detail Test Client', industry: 'Services', employeeCount: 3 });

      const res = await request(app.getHttpServer())
        .post('/workflow-instances')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ templateId, clientId: clientRes.body.id });
      instanceId = res.body.id;
    });

    it('should return a specific workflow instance with steps', async () => {
      const res = await request(app.getHttpServer())
        .get(`/workflow-instances/${instanceId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(instanceId);
      expect(res.body).toHaveProperty('steps');
      expect(Array.isArray(res.body.steps)).toBe(true);
      expect(res.body.steps.length).toBe(3);
    });

    it('should return 404 for non-existent instance', async () => {
      const res = await request(app.getHttpServer())
        .get('/workflow-instances/00000000-0000-0000-0000-999999999997')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /workflow-instances/trigger/monthly', () => {
    it('should allow OWNER to trigger monthly instance creation', async () => {
      const res = await request(app.getHttpServer())
        .post('/workflow-instances/trigger/monthly')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('count');
    });

    it('should forbid SENIOR from triggering monthly creation', async () => {
      const res = await request(app.getHttpServer())
        .post('/workflow-instances/trigger/monthly')
        .set('Authorization', `Bearer ${seniorToken}`)
        .send({});

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /workflow-instances/:instanceId/steps/:stepId', () => {
    let instanceId: string;
    let stepId: string;

    beforeAll(async () => {
      const clientRes = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Step Test Client', industry: 'Retail', employeeCount: 8 });

      const instanceRes = await request(app.getHttpServer())
        .post('/workflow-instances')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ templateId, clientId: clientRes.body.id });

      instanceId = instanceRes.body.id;
      stepId = instanceRes.body.steps[0].id;
    });

    it('should start a workflow step', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/workflow-instances/${instanceId}/steps/${stepId}/start`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in_progress');
    });

    it('should complete a workflow step', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/workflow-instances/${instanceId}/steps/${stepId}/complete`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
    });
  });
});
