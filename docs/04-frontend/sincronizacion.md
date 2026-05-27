# Sincronización Cliente-Servidor — Arena Siege Tanks

> El problema central del multiplayer en tiempo real: reducir la latencia percibida.
> Tres técnicas combinadas: predicción, interpolación y reconciliación.

---

## El problema

El servidor corre a 30 ticks/s = 1 estado cada 33ms.
Con latencia de red de 80ms, el jugador ve el juego con 80ms de retraso si solo usa los estados del servidor.

La solución son tres técnicas combinadas:

---

## 1. Client-Side Prediction (para el jugador local)

**Idea**: El cliente aplica el input inmediatamente sin esperar al servidor.

```
Sin predicción:
  Input → esperar 80ms → servidor procesa → respuesta → renderizar
  Latencia percibida: 160ms (round trip)

Con predicción:
  Input → aplicar localmente de inmediato → renderizar
  Servidor confirma más tarde (puede diferir levemente)
  Latencia percibida: 0ms
```

### Implementación

```typescript
// En GameScene.update()
const input = this.inputSystem.capture();

// Guardar el input con su número de tick
const inputWithTick: PlayerInputRecord = {
  ...input,
  clientTick: this.clientTick++,
  timestamp: Date.now(),
};

// Aplicar INMEDIATAMENTE al jugador local (predicción)
this.playerTank.applyPrediction(input, delta);

// Guardar en historial para reconciliación posterior
this.predictionHistory.push(inputWithTick);

// Enviar al servidor
this.socketService.sendInput(inputWithTick);
```

---

## 2. Server Reconciliation (corregir desviaciones)

**Problema**: El estado del servidor puede diferir del estado predicho (por lag o desincronización).

**Solución**: Cuando llega `game_state` del servidor, corregir la posición del jugador local aplicando de nuevo todos los inputs pendientes desde el tick del servidor.

```typescript
class ReconciliationSystem {
  private inputHistory: PlayerInputRecord[] = [];

  reconcile(playerTank: PlayerTank, serverState: PlayerState) {
    const serverTick = serverState.lastProcessedTick;

    // Eliminar del historial los inputs ya confirmados por el servidor
    this.inputHistory = this.inputHistory.filter(
      record => record.clientTick > serverTick
    );

    // Calcular la desviación entre predicción y estado del servidor
    const deviation = distance(playerTank.position, serverState.position);

    if (deviation < RECONCILIATION_THRESHOLD) {
      // Desviación pequeña: hacer lerp suave hacia la posición del servidor
      playerTank.x = lerp(playerTank.x, serverState.position.x, 0.3);
      playerTank.y = lerp(playerTank.y, serverState.position.y, 0.3);
    } else {
      // Desviación grande: snapear a la posición del servidor
      // y re-aplicar los inputs no confirmados
      playerTank.x = serverState.position.x;
      playerTank.y = serverState.position.y;

      for (const record of this.inputHistory) {
        playerTank.applyPrediction(record, TICK_DURATION_MS);
      }
    }
  }
}
```

---

## 3. Interpolación (para jugadores remotos)

**Problema**: Los otros jugadores se mueven a saltos (un update cada 33ms) en lugar de moverse suavemente.

**Solución**: Renderizar a los jugadores remotos con 100ms de delay, interpolando entre los dos últimos estados recibidos.

```
Timeline:
  t=0ms:   llega state A (jugador en x=100)
  t=33ms:  llega state B (jugador en x=120)
  t=66ms:  llega state C (jugador en x=140)

  Con delay de 100ms:
  t=0ms:   renderizamos en t=-100ms (no tenemos datos) → esperar
  t=100ms: renderizamos en t=0ms → posición x=100
  t=133ms: renderizamos en t=33ms → posición x=120
  t=116ms: renderizamos en t=16ms → interpolamos A→B al 50% → x=110 ✓
```

### Implementación

```typescript
class InterpolationSystem {
  // Buffer de snapshots por jugador remoto
  private buffers: Map<string, SnapshotBuffer> = new Map();
  private readonly RENDER_DELAY_MS = 100;

  addSnapshot(playerId: string, state: PlayerState, serverTimestamp: number) {
    if (!this.buffers.has(playerId)) {
      this.buffers.set(playerId, new SnapshotBuffer());
    }
    this.buffers.get(playerId)!.add(state, serverTimestamp);
  }

  update(remoteTanks: Map<string, RemoteTank>, currentServerTime: number) {
    const renderTime = currentServerTime - this.RENDER_DELAY_MS;

    for (const [playerId, buffer] of this.buffers) {
      const tank = remoteTanks.get(playerId);
      if (!tank) continue;

      const interpolated = buffer.interpolateAt(renderTime);
      if (interpolated) {
        tank.x = interpolated.position.x;
        tank.y = interpolated.position.y;
        tank.cannon.rotation = interpolated.rotation;
      }
    }
  }
}

class SnapshotBuffer {
  private snapshots: Array<{ timestamp: number; state: PlayerState }> = [];
  private readonly MAX_SNAPSHOTS = 10;

  add(state: PlayerState, timestamp: number) {
    this.snapshots.push({ timestamp, state });
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }
  }

  interpolateAt(time: number): PlayerState | null {
    // Encontrar el snapshot anterior y siguiente al tiempo objetivo
    let before: typeof this.snapshots[0] | null = null;
    let after: typeof this.snapshots[0] | null = null;

    for (let i = 0; i < this.snapshots.length - 1; i++) {
      if (this.snapshots[i].timestamp <= time && this.snapshots[i+1].timestamp >= time) {
        before = this.snapshots[i];
        after = this.snapshots[i+1];
        break;
      }
    }

    if (!before || !after) return null;

    const t = (time - before.timestamp) / (after.timestamp - before.timestamp);

    return {
      ...after.state,
      position: {
        x: lerp(before.state.position.x, after.state.position.x, t),
        y: lerp(before.state.position.y, after.state.position.y, t),
      },
      rotation: lerpAngle(before.state.rotation, after.state.rotation, t),
    };
  }
}
```

---

## Sincronización del tiempo cliente-servidor

Para que la interpolación funcione, el cliente necesita estimar el tiempo actual del servidor.

```typescript
class ServerTimeSynchronizer {
  private offset: number = 0;   // milisegundos de diferencia
  private rtt: number = 0;      // round trip time estimado

  // Llamar al conectarse al servidor
  async sync(socket: Socket): Promise<void> {
    const t0 = Date.now();
    socket.emit('ping', { t0 });
    socket.once('pong', ({ t0: originalT0, serverTime }) => {
      const t2 = Date.now();
      this.rtt = t2 - originalT0;
      const estimatedServerTime = serverTime + this.rtt / 2;
      this.offset = estimatedServerTime - t2;
    });
  }

  getServerTime(): number {
    return Date.now() + this.offset;
  }
}
```

---

## Resumen de técnicas

| Técnica | Para quién | Efecto |
|---------|-----------|--------|
| Client-side prediction | Jugador local | 0ms de latencia percibida en movimiento |
| Server reconciliation | Jugador local | Corrige desviaciones entre predicción y servidor |
| Interpolación | Jugadores remotos | Movimiento suave entre updates de 33ms |
| Delay de 100ms | Jugadores remotos | Buffer de seguridad para recibir 3+ estados antes de renderizar |
