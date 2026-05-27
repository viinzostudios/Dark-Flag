# Seguridad — Arena Siege Tanks

---

## 1. Autenticación y tokens

### JWT (Access Token)
- Algoritmo: HS256
- Expiración: 15 minutos
- Payload: `{ sub: userId, username, iat, exp }`
- **Nunca** incluir datos sensibles (contraseñas, tokens de pago)

### Refresh Token
- Expiración: 7 días
- Almacenado en Redis con clave `auth:refresh:{userId}:{tokenId}`
- Al hacer logout: DELETE de la clave → invalidación instantánea
- Al detectar uso de un token ya revocado: revocar TODOS los refresh tokens del usuario (posible robo)

### Configuración
```typescript
// JWT Options (NestJS)
JwtModule.registerAsync({
  useFactory: (config: ConfigService) => ({
    secret: config.get('JWT_SECRET'),
    signOptions: { expiresIn: '15m' },
  }),
})
```

---

## 2. Validación de inputs

**Regla**: Todo input que viene de fuera del sistema (HTTP body, WebSocket payload) se valida con `class-validator`.

### En la API REST
```typescript
// Ejemplo de DTO validado
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  username: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*\d)/, { message: 'Password must contain at least one number' })
  password: string;
}
```

### En el Game Server (inputs de jugador)
```typescript
function validatePlayerInput(input: unknown): PlayerInput | null {
  if (!input || typeof input !== 'object') return null;
  
  const { direction, rotation, actions } = input as any;
  
  // Validar vector de dirección
  if (typeof direction?.x !== 'number' || typeof direction?.y !== 'number') return null;
  if (Math.abs(direction.x) > 1.01 || Math.abs(direction.y) > 1.01) return null;
  
  // Validar rotación
  if (typeof rotation !== 'number') return null;
  
  // Validar acciones (booleanos)
  return {
    direction: {
      x: Math.max(-1, Math.min(1, direction.x)),
      y: Math.max(-1, Math.min(1, direction.y)),
    },
    rotation: rotation % (Math.PI * 2),
    actions: {
      shoot: Boolean(actions?.shoot),
      placeWallFront: Boolean(actions?.placeWallFront),
      placeWallBack: Boolean(actions?.placeWallBack),
    },
    clientTick: typeof input.clientTick === 'number' ? input.clientTick : 0,
  };
}
```

---

## 3. Rate Limiting

### API REST (NestJS Throttler)
```typescript
ThrottlerModule.forRoot([
  { name: 'default', ttl: 60000, limit: 100 },         // 100 req/min general
  { name: 'auth',    ttl: 900000, limit: 5 },           // 5 intentos/15min en login
  { name: 'purchase', ttl: 3600000, limit: 10 },        // 10 compras/hora
])
```

### Game Server (inputs WebSocket)
```typescript
// En el Gateway
@SubscribeMessage('player_input')
handleInput(@ConnectedSocket() client: Socket, @MessageBody() input: unknown) {
  const playerId = client.data.userId;
  
  // Rate limiting simple en memoria (60 inputs/segundo máximo)
  const key = `rate:${playerId}`;
  const count = this.rateCounter.increment(key);
  if (count > 60) return; // silenciosamente ignorar
  
  // Procesar input...
}
```

---

## 4. Seguridad del juego (anti-cheat)

### Principio fundamental
**El servidor es la autoridad. El cliente nunca dicta el estado del juego.**

| Qué no hacer | Por qué |
|-------------|---------|
| Confiar en la posición que envía el cliente | Un cliente modificado puede teletransportarse |
| Permitir al cliente reportar kills | Un cliente puede reportar kills falsas |
| Validar colisiones solo en el cliente | Fácilmente bypaseable |

### Medidas implementadas
1. **Validación de velocidad**: Si la nueva posición implica una velocidad mayor a `MAX_SPEED * 1.1`, se rechaza
2. **Anti-teleport**: Si la distancia entre el estado anterior y el nuevo input es > `MAX_SPEED * MAX_TICK_DURATION * 2`, se ignora el input
3. **Cooldown verificado en servidor**: El servidor mantiene el timestamp del último disparo; el cliente no puede forzar disparos más rápidos

---

## 5. Seguridad económica

### Reglas de transacciones
```typescript
async function spendCoins(userId: string, amount: number): Promise<void> {
  // Siempre en una transacción de DB
  await dataSource.transaction(async manager => {
    const profile = await manager.findOne(UserProfile, {
      where: { id: userId },
      lock: { mode: 'pessimistic_write' }, // bloqueo para evitar race conditions
    });
    
    if (profile.coins < amount) {
      throw new BadRequestException('Insufficient coins');
    }
    
    profile.coins -= amount;
    await manager.save(profile);
    
    // Registrar en log de transacciones
    await manager.save(Transaction, {
      userId,
      type: 'spend',
      amount,
      currency: 'coins',
    });
  });
}
```

### Validaciones adicionales
- La acreditación de `premium_coins` solo ocurre desde el webhook de Stripe (nunca desde el cliente)
- Verificar idempotencia: el `stripe_payment_intent_id` no puede procesarse dos veces
- Las compras de skins verifican que el usuario NO tenga ya esa skin

---

## 6. Seguridad de infraestructura

### Variables de entorno
- **Nunca** hardcodear secrets en el código
- Usar `.env` para desarrollo (en `.gitignore`)
- Usar secrets de GitHub Actions para CI/CD
- En producción: variables de entorno del servidor o gestor de secrets

### CORS
```typescript
// main.ts (NestJS)
app.enableCors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://arenasiege.com', 'https://www.arenasiege.com']
    : ['http://localhost:4200'],
  credentials: true,
});
```

### Helmet (headers de seguridad HTTP)
```typescript
import helmet from 'helmet';
app.use(helmet());
```

### Comunicación interna (Game Server → API)
```typescript
// El game server se autentica con un secret compartido, no con JWT de usuario
headers: {
  'x-internal-secret': process.env.INTERNAL_SECRET,
}
```

---

## 7. Checklist de seguridad por fase

### Fase 2 (autenticación):
- [ ] Contraseñas hasheadas con bcrypt (cost factor: 12)
- [ ] JWT con expiración corta
- [ ] Refresh tokens en Redis (revocables)
- [ ] Rate limiting en login

### Fase 3 (multiplayer):
- [ ] Validar todos los inputs del jugador en el servidor
- [ ] Límite de velocidad del tanque verificado en servidor
- [ ] Cooldowns verificados en servidor

### Fase 5 (economía):
- [ ] Transacciones de BD para operaciones de moneda
- [ ] Logs de todas las transacciones

### Fase 6 (pagos):
- [ ] Webhook de Stripe verificado por firma
- [ ] Idempotencia en acreditación de pagos
- [ ] HTTPS en producción
