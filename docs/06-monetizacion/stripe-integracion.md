# Integración Stripe — Arena Siege Tanks

---

## Flujo de pago

```
1. Cliente selecciona pack → POST /shop/purchase/intent
2. API crea PaymentIntent en Stripe → devuelve clientSecret
3. Cliente usa Stripe.js para mostrar formulario de tarjeta
4. Usuario confirma el pago → Stripe procesa
5. Stripe envía webhook payment_intent.succeeded → POST /stripe/webhook
6. API acredita premium_coins al usuario
7. Cliente redirige a /shop?success=true
```

---

## Variables de entorno requeridas

```bash
STRIPE_SECRET_KEY=sk_live_xxx       # sk_test_xxx en desarrollo
STRIPE_WEBHOOK_SECRET=whsec_xxx     # Se obtiene del dashboard de Stripe
```

---

## Backend — Endpoints

### POST /shop/purchase/intent

```typescript
@Post('purchase/intent')
@UseGuards(JwtAuthGuard)
async createPaymentIntent(
  @Body() dto: PurchaseIntentDto,
  @CurrentUser() user: User,
) {
  const pack = COIN_PACKS.find(p => p.id === dto.packId);
  if (!pack) throw new NotFoundException('Pack not found');

  const intent = await this.stripe.paymentIntents.create({
    amount: Math.round(pack.priceUsd * 100), // en centavos
    currency: 'usd',
    metadata: {
      userId: user.id,
      packId: pack.id,
      premiumCoins: pack.premiumCoins.toString(),
    },
  });

  return { clientSecret: intent.client_secret };
}
```

### POST /stripe/webhook

```typescript
@Post('webhook')
async handleWebhook(
  @RawBody() rawBody: Buffer,
  @Headers('stripe-signature') signature: string,
) {
  let event: Stripe.Event;
  
  try {
    event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    throw new BadRequestException('Invalid webhook signature');
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { userId, premiumCoins } = intent.metadata;
    
    await this.economyService.creditPremiumCoins(
      userId,
      parseInt(premiumCoins),
      intent.id,
    );
  }

  return { received: true };
}
```

---

## Frontend — Stripe Elements

```typescript
// En el componente de checkout
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_live_xxx'); // pk_test_xxx en desarrollo

// Después de obtener el clientSecret
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#card-element');

// Al hacer submit
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
});

if (result.error) {
  // Mostrar error al usuario
} else {
  // Redirigir a /shop?success=true
}
```

---

## Seguridad

- El webhook usa la firma de Stripe para verificar autenticidad
- El `rawBody` (sin parsear) es necesario para verificar la firma — configurar en NestJS con `{ rawBody: true }`
- El `clientSecret` nunca se persiste en la BD
- La acreditación de coins solo ocurre desde el webhook (nunca desde el cliente)
- Verificar en la BD que el `stripe_payment_intent_id` no se procese dos veces
