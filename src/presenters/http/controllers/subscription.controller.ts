import { Controller, Post, Get, Body, Req, UseGuards, Headers, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@infra/http/auth/guards/jwt-auth.guard';
import { CoupleGuard } from '@infra/http/auth/guards/couple.guard';
import { UserId } from '@infra/http/auth/decorators/user-id.decorator';
import { CoupleId } from '@infra/http/auth/decorators/couple-id.decorator';
import { CreateCheckoutSessionUseCase } from '@application/subscription/use-cases/create-checkout-session.use-case';
import { GetSubscriptionStatusUseCase } from '@application/subscription/use-cases/get-subscription-status.use-case';
import { HandleWebhookUseCase } from '@application/subscription/use-cases/handle-webhook.use-case';
import { CreatePortalSessionUseCase } from '@application/subscription/use-cases/create-portal-session.use-case';
import { Request } from 'express';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly createCheckoutSessionUseCase: CreateCheckoutSessionUseCase,
    private readonly getSubscriptionStatusUseCase: GetSubscriptionStatusUseCase,
    private readonly handleWebhookUseCase: HandleWebhookUseCase,
    private readonly createPortalSessionUseCase: CreatePortalSessionUseCase,
  ) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard, CoupleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session to upgrade to premium' })
  @ApiResponse({ status: 201, description: 'Checkout session created successfully' })
  async createCheckout(
    @UserId() userId: string,
    @CoupleId() coupleId: string,
    @Body('userEmail') userEmail: string,
  ) {
    return this.createCheckoutSessionUseCase.execute({
      userId,
      coupleId,
      userEmail,
    });
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, CoupleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription status' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved' })
  async getStatus(@CoupleId() coupleId: string) {
    return this.getSubscriptionStatusUseCase.execute({ coupleId });
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const body = request.rawBody;

    if (!body) {
      throw new Error('No request body');
    }

    return this.handleWebhookUseCase.execute({
      body,
      signature,
    });
  }

  @Get('portal')
  @UseGuards(JwtAuthGuard, CoupleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  @ApiResponse({ status: 200, description: 'Customer portal session created' })
  async createPortal(@CoupleId() coupleId: string) {
    return this.createPortalSessionUseCase.execute({ coupleId });
  }
}
