import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');

  // Serve static files from public directory (after setting global prefix)
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('ProcessFlow Pro API')
    .setDescription('The ProcessFlow Pro workflow management system API for automating payroll and statutory deadline workflows')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and token management')
    .addTag('Users', 'User management endpoints')
    .addTag('Clients', 'Client management endpoints')
    .addTag('Workflow Templates', 'Template creation and management')
    .addTag('Workflow Instances', 'Workflow instance lifecycle management')
    .addTag('Workflow Execution', 'Workflow step execution and tracking')
    .addTag('Dashboard', 'Dashboard metrics and analytics')
    .addTag('Notifications', 'User notification management')
    .addTag('Reporting', 'Report generation and export')
    .addTag('Deadline Calculator', 'Deadline calculation utilities')
    .addServer(process.env.API_URL || 'http://localhost:3000', 'Development server')
    .addServer('https://api.processflowpro.com', 'Production server')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`✅ ProcessFlow Pro Backend running on http://localhost:${port}`);
  console.log(`📚 API Docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
