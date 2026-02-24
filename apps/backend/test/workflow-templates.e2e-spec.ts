import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/entities/user.entity';
import { WorkflowStepType } from '../database/entities/template-step.entity';

describe('Workflow Templates E2E', () => {
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

  describe('POST /workflow-templates', () => {
    it('should create a new template with steps', async () => {
      const res = await request(app.getHttpServer())
        .post('/workflow-templates')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Payroll Processing',
          industry: 'Finance',
          description: 'Standard payroll workflow',
          steps: [
            {
              type: WorkflowStepType.START,
              name: 'Start Process',
              description: 'Initiate payroll cycle',
              estimationAllowed: false,
            },
            {
              type: WorkflowStepType.TASK,
              name: 'Collect Data',
              description: 'Gather employee data',
              estimationAllowed: true,
              checklist: [{ id: '1', text: 'Verify hours', required: true }],
            },
            {
              type: WorkflowStepType.END,
              name: 'Complete',
              description: 'Finalize payroll',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Payroll Processing');
      expect(res.body.steps.length).toBe(3);
      expect(res.body.steps[0].order).toBe(1);
      expect(res.body.steps[1].order).toBe(2);
    });
  });

  describe('GET /workflow-templates', () => {
    it('should list all templates', async () => {
      const res = await request(app.getHttpServer())
        .get('/workflow-templates')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /workflow-templates/:id/steps', () => {
    it('should add a step to existing template', async () => {
      // Create template first
      const createRes = await request(app.getHttpServer())
        .post('/workflow-templates')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Test Template',
          industry: 'Testing',
        });

      const templateId = createRes.body.id;

      // Add step
      const res = await request(app.getHttpServer())
        .post(`/workflow-templates/${templateId}/steps`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          type: WorkflowStepType.TASK,
          name: 'New Task',
          description: 'A dynamic task',
          estimationAllowed: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Task');
      expect(res.body.order).toBe(1);
    });
  });

  describe('PATCH /workflow-templates/:id', () => {
    it('should update template', async () => {
      // Create template
      const createRes = await request(app.getHttpServer())
        .post('/workflow-templates')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'To Update',
          industry: 'Old Industry',
        });

      const templateId = createRes.body.id;

      // Update
      const res = await request(app.getHttpServer())
        .patch(`/workflow-templates/${templateId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          industry: 'New Industry',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.industry).toBe('New Industry');
      expect(res.body.description).toBe('Updated description');
    });
  });

  describe('POST /workflow-templates/:id/steps/reorder', () => {
    it('should reorder steps', async () => {
      // Create template with steps
      const createRes = await request(app.getHttpServer())
        .post('/workflow-templates')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Reorder Test',
          steps: [
            { type: WorkflowStepType.START, name: 'Step 1' },
            { type: WorkflowStepType.TASK, name: 'Step 2' },
            { type: WorkflowStepType.END, name: 'Step 3' },
          ],
        });

      const templateId = createRes.body.id;
      const stepIds = createRes.body.steps.map((s: any) => s.id);

      // Reorder: reverse the array
      const res = await request(app.getHttpServer())
        .post(`/workflow-templates/${templateId}/steps/reorder`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          stepIds: [stepIds[2], stepIds[1], stepIds[0]],
        });

      expect(res.status).toBe(201);
      expect(res.body[0].name).toBe('Step 3');
      expect(res.body[1].name).toBe('Step 2');
      expect(res.body[2].name).toBe('Step 1');
      expect(res.body[0].order).toBe(1);
      expect(res.body[1].order).toBe(2);
      expect(res.body[2].order).toBe(3);
    });
  });
});
