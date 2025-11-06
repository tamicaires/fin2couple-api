import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Express } from 'express';
import { AppModule } from './app.module';

let cachedApp: Express;

async function createNestApp(expressApp: Express) {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  // CORS configuration for production
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('FINDUO API')
    .setDescription('Financial management for couples - Multi-tenant SaaS API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Couple', 'Couple (tenant) management')
    .addTag('Accounts', 'Financial accounts management')
    .addTag('Transactions', 'Transaction tracking and management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();

  return expressApp;
}

export default async (req: any, res: any) => {
  if (!cachedApp) {
    const express = require('express');
    const expressApp = express();
    cachedApp = await createNestApp(expressApp);
  }

  return cachedApp(req, res);
};
