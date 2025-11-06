import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggingModule } from '@infra/logging/logging.module';
import { UserGameProfileModule } from '@application/user-game-profile/user-game-profile.module';
import { AchievementModule } from '@application/achievement/achievement.module';

// Listeners
import { TransactionMonitoringListener } from './listeners/transaction-monitoring.listener';
import { GamificationListener } from './listeners/gamification.listener';
import { AchievementListener } from './listeners/achievement.listener';

/**
 * Events Module
 *
 * Centralized event handling for the application
 *
 * Features:
 * - Transaction monitoring and analytics
 * - Free spending tracking
 * - Gamification (XP, Achievements, Streak)
 * - Audit logging
 */
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
    }),
    LoggingModule,
    UserGameProfileModule,
    AchievementModule,
  ],
  providers: [
    TransactionMonitoringListener,
    GamificationListener,
    AchievementListener,
  ],
  exports: [EventEmitterModule],
})
export class EventsModule {}
