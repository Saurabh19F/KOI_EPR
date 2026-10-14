import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as pg from 'pg';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Configure PG client to parse TIMESTAMP WITHOUT TIME ZONE (OID 1114) as UTC
pg.types.setTypeParser(1114, (stringValue) => {
  return new Date(stringValue + 'Z');
});


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const logger = new Logger('Bootstrap');

  // Middleware to sanitize empty string fields to undefined in request bodies
  app.use((req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
      const sanitize = (obj: any) => {
        for (const key in obj) {
          if (obj[key] === '') {
            delete obj[key];
          } else if (obj[key] && typeof obj[key] === 'object') {
            sanitize(obj[key]);
          }
        }
      };
      sanitize(req.body);
    }
    next();
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  }));

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      // Allow all localhost ports for development
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }
      // Allow raw IP access (any port)
      if (origin.match(/^https?:\/\/187\.127\.149\.196(:\d+)?$/)) {
        return callback(null, true);
      }
      // Allow nip.io and sslip.io wildcard domains containing the VPS IP
      if (origin.match(/^https?:\/\/.*187\.127\.149\.196\.nip\.io(:\d+)?$/)) {
        return callback(null, true);
      }
      if (origin.match(/^https?:\/\/.*187\.127\.149\.196\.sslip\.io(:\d+)?$/)) {
        return callback(null, true);
      }
      // Allow production frontend URL if configured
      const frontendUrl = process.env.FRONTEND_URL;
      if (frontendUrl && origin === frontendUrl) {
        return callback(null, true);
      }
      // Allow any additional CORS origins from env
      const extraOrigins = (process.env.EXTRA_CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
      if (extraOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('ERP Platform API')
    .setDescription('Centralized ERP Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('masters', 'Master data management')
    .addTag('sales', 'Sales enquiry management')
    .addTag('purchase', 'Purchase quote management')
    .addTag('rate', 'Rate analysis')
    .addTag('fms', 'Workflow management')
    .addTag('files', 'File management')
    .addTag('notifications', 'Notifications')
    .addTag('reports', 'Reports')
    .addTag('admin', 'Admin settings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 ERP API running on port ${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
