import {
  Controller, Post, Body, Headers,
  Req, UseGuards, Request, Get,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StripeService } from './stripe.service';

@Controller()
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Get('shop/packages')
  getPackages() {
    return this.stripeService.getCoinPackages();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('shop/purchase/intent')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createIntent(@Request() req: any, @Body() body: any) {
    return this.stripeService.createPaymentIntent(req.user.id as string, body.packageId as string);
  }

  // Raw body required for Stripe signature verification
  @Post('stripe/webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    await this.stripeService.handleWebhook(req.rawBody!, sig);
    return { received: true };
  }
}
