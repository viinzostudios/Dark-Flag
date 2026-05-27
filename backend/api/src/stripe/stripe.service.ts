import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeLib = require('stripe');
import { EconomyService } from '../economy/economy.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeInstance = any;

export const COIN_PACKAGES = [
  { id: 'coins_5000',  coins: 5000,  premiumCoins: 0,    amountCents: 499,  label: '5 000 Coins' },
  { id: 'coins_13000', coins: 13000, premiumCoins: 200,  amountCents: 999,  label: '13 000 Coins + 200 Gemas' },
  { id: 'coins_30000', coins: 30000, premiumCoins: 450,  amountCents: 1999, label: '30 000 Coins + 450 Gemas' },
  { id: 'coins_65000', coins: 65000, premiumCoins: 1000, amountCents: 3999, label: '65 000 Coins + 1 000 Gemas' },
] as const;

@Injectable()
export class StripeService {
  private readonly stripe: StripeInstance;
  private readonly webhookSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly economy: EconomyService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY') ?? 'sk_test_placeholder';
    this.stripe = new StripeLib(key, { apiVersion: '2026-04-22.dahlia' });
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
  }

  getCoinPackages() {
    return COIN_PACKAGES;
  }

  async createPaymentIntent(userId: string, packageId: string): Promise<{ clientSecret: string }> {
    const pkg = COIN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) throw new BadRequestException('Invalid package');

    const intent = await this.stripe.paymentIntents.create({
      amount: pkg.amountCents,
      currency: 'usd',
      metadata: { userId, packageId },
      automatic_payment_methods: { enabled: true },
    });

    return { clientSecret: intent.client_secret as string };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const { userId, packageId } = intent.metadata as { userId: string; packageId: string };
      const pkg = COIN_PACKAGES.find(p => p.id === packageId);
      if (!pkg || !userId) return;

      await this.economy.addCoins(userId, pkg.coins, 'earn_premium', `Compra: ${pkg.label}`);
    }
  }
}
