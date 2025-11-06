import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '@infra/logging/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly logger: LoggerService) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Query logging middleware
    this.$on('query' as never, (e: any) => {
      this.logger.logQuery(
        e.target || 'unknown',
        'query',
        e.duration,
        { query: e.query, params: e.params },
      );
    });

    // Error logging
    this.$on('error' as never, (e: any) => {
      this.logger.error('Prisma Error', e.message);
    });

    // Warn logging
    this.$on('warn' as never, (e: any) => {
      this.logger.warn('Prisma Warning', { message: e.message });
    });
  }

  async onModuleInit() {
    console.log('🔵 [Prisma] Attempting to connect to database...');
    try {
      await this.$connect();
      console.log('✅ [Prisma] Successfully connected to database');
      this.logger.log('Prisma connected to database');
    } catch (error) {
      console.error('❌ [Prisma] Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }

  // Clean disconnect for graceful shutdown
  async enableShutdownHooks(app: { close: () => Promise<void> }) {
    this.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }
}
