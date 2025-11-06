import { Module } from '@nestjs/common';
import { AuthModule } from '@application/auth/auth.module';
import { CoupleModule } from '@application/couple/couple.module';
import { AccountModule } from '@application/account/account.module';
import { TransactionModule } from '@application/transaction/transaction.module';
import { CategoryModule } from '@application/category/category.module';
import { UserGameProfileModule } from '@application/user-game-profile/user-game-profile.module';
import { AchievementModule } from '@application/achievement/achievement.module';
import { AdminModule } from '@application/admin/admin.module';
import { PaymentModule } from '@infra/payment/payment.module';

// Controllers
import { AuthController } from './http/controllers/auth.controller';
import { CoupleController } from './http/controllers/couple.controller';
import { AccountController } from './http/controllers/account.controller';
import { TransactionController } from './http/controllers/transaction.controller';
import { RecurringTemplateController } from './http/controllers/recurring-template.controller';
import { CategoryController } from './http/controllers/category.controller';
import { UserGameProfileController } from './http/controllers/user-game-profile.controller';
import { AchievementController } from './http/controllers/achievement.controller';
import { AdminController } from './http/controllers/admin.controller';

@Module({
  imports: [
    AuthModule,
    CoupleModule,
    AccountModule,
    TransactionModule,
    CategoryModule,
    UserGameProfileModule,
    AchievementModule,
    AdminModule,
    PaymentModule,
  ],
  controllers: [
    AuthController,
    CoupleController,
    AccountController,
    TransactionController,
    RecurringTemplateController,
    CategoryController,
    UserGameProfileController,
    AchievementController,
    AdminController,
  ],
})
export class PresenterModule {}
