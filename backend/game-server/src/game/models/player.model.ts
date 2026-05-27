export interface PlayerState {
  id: string;
  userId: string;
  username: string;
  x: number;
  y: number;
  rotation: number;
  hp: number;
  maxHp: number;
  isDead: boolean;
  ammo: number;
  score: number;
  isLeader: boolean;
  skinId: string | null;
}
