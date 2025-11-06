import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🔵 [1/6] Starting bootstrap...');

  console.log('🔵 [2/6] Creating NestFactory app...');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  console.log('✅ [2/6] NestFactory app created');

  console.log('�� [3/6] Configuring CORS...');
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://192.168.0.190:5173', // IP local para acesso mobile
      /^http:\/\/192\.168\.\d+\.\d+:5173$/, // Qualquer IP da rede local
      'https://fincouple.facter.com.br', // Frontend na Vercel
      /^https:\/\/.*\.vercel\.app$/, // Preview deployments da Vercel
    ],
    credentials: true,
  });
  console.log('✅ [3/6] CORS configured');

  console.log('🔵 [4/6] Setting up global pipes...');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  console.log('✅ [4/6] Global pipes configured');

  // Swagger configuration - comentado temporariamente para debug
  // const config = new DocumentBuilder()
  //   .setTitle('FINDUO API')
  //   .setDescription('Financial management for couples - Multi-tenant SaaS API')
  //   .setVersion('1.0')
  //   .addBearerAuth()
  //   .addTag('Authentication', 'User authentication endpoints')
  //   .addTag('Couple', 'Couple (tenant) management')
  //   .addTag('Accounts', 'Financial accounts management')
  //   .addTag('Transactions', 'Transaction tracking and management')
  //   .build();

  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api/docs', app, document);

  console.log('🔵 [5/6] Starting server on port ' + (process.env.PORT ?? 3000) + '...');
  await app.listen(process.env.PORT ?? 3000);
  console.log('✅ [5/6] Server started successfully');

  console.log('🔵 [6/6] Bootstrap complete!');
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}

console.log('🟢 Starting application...');
bootstrap().catch((err) => {
  console.error('❌ Fatal error during bootstrap:', err);
  process.exit(1);
});
