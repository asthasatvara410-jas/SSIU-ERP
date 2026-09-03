import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('SSIU_ERP_Backend');
  const app = await NestFactory.create(AppModule);

  // Global Response Transform Interceptor & Exception Filter
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Payload Size Limits & Anti-DOS Protection
  const express = require('express');
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Security Headers Middleware
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-Download-Options', 'noopen');
    next();
  });

  // Enable CORS for SSIU ERP Frontend
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // OpenAPI / Swagger Interactive Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SSIU ERP Enterprise Production REST API')
    .setDescription(
      'Official REST API platform for Swarrnim Startup & Innovation University ERP system (Core Governance, People, Auth, and RBAC Authority Subsystems).'
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'SSIU ERP Production REST API Docs',
  });

  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const server = app.getHttpServer();
  const router = server?._events?.request?._router;
  if (router?.stack) {
    const availableRoutes: string[] = [];
    router.stack.forEach((layer: any) => {
      if (layer.route) {
        const path = layer.route?.path;
        const method = Object.keys(layer.route?.methods || {}).join(', ').toUpperCase();
        availableRoutes.push(`Mapped {${path}, ${method}}`);
      }
    });
    const agentRoutes = availableRoutes.filter((r) => r.toLowerCase().includes('agent'));
    logger.log(`🔍 [Router Diagnostic] ${agentRoutes.length} Agent routes mapped in Express:`);
    agentRoutes.forEach((r) => logger.log(`   ${r}`));
  }

  logger.log(`🚀 SSIU ERP Production Backend Engine listening on http://localhost:${port}`);
  logger.log(`📖 OpenAPI / Swagger Live Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔐 Authentication Endpoints active: http://localhost:${port}/api/v1/auth/login`);
  logger.log(`🤖 Agentic ERP Automation Platform active: http://localhost:${port}/api/v1/agents`);
  logger.log(`🏥 Health endpoints active: http://localhost:${port}/health & http://localhost:${port}/api/v1/health`);
}

bootstrap().catch((err) => {
  const logger = new Logger('SSIU_ERP_Bootstrap');
  if (err?.code === 'EADDRINUSE') {
    logger.error(`Port ${process.env.PORT || 3001} is already in use by another running backend process. Please stop duplicate instances.`);
  } else {
    logger.error('Failed to start SSIU ERP backend:', err);
  }
  process.exit(1);
});
