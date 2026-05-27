import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameStateService } from './services/game-state.service';
import { GameLoopService } from './services/game-loop.service';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [RoomsModule],
  providers: [GameGateway, GameStateService, GameLoopService],
})
export class GameModule {}
