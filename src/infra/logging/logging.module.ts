import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Global()
@Module({
  providers: [LoggerService, LoggingInterceptor],
  exports: [LoggerService, LoggingInterceptor],
})
export class LoggingModule {}
