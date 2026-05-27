import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene } from './scenes/GameScene';
import { GAME } from './constants';
import { GameSocketService } from '../core/services/game-socket.service';
import { AdsService } from '../core/services/ads.service';
import { GameStateSignalService } from '../core/services/game-state-signal.service';

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

export function buildPhaserConfig(
  parent: HTMLElement,
  socketService?: GameSocketService,
  adsService?: AdsService,
  gameStateSignal?: GameStateSignalService,
  translateFn?: TranslateFn,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#12121f',
    scene: [PreloadScene, GameScene],
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
    fps: {
      target: 60,
      limit: 60,
    },
    callbacks: {
      preBoot: (game: Phaser.Game) => {
        game.registry.set('mapWidth', GAME.MAP_WIDTH);
        game.registry.set('mapHeight', GAME.MAP_HEIGHT);
        if (socketService) game.registry.set('socketService', socketService);
        if (adsService) game.registry.set('adsService', adsService);
        if (gameStateSignal) game.registry.set('gameStateSignal', gameStateSignal);
        if (translateFn) game.registry.set('translateFn', translateFn);
      },
    },
  };
}
