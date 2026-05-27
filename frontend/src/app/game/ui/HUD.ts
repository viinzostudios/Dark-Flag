import Phaser from 'phaser';
import { GAME, POWER_COLORS, getLevelColor } from '../constants';
import { LeaderboardEntry, PowerUpType } from '../../core/services/game-socket.service';
import { TranslateFn } from '../game.config';

const POWER_ICONS: Partial<Record<PowerUpType, string>> = {
  MACE_SHIELD: '🛡️',
  REVELATION:  '👁️',
  SPRINT:      '⚡',
  BLACKOUT:    '🌑',
  SUPER_MACE:  '💥',
  GHOST:       '👻',
};
const POWER_DURATION_MS = 10000;

export class HUD {
  private readonly scene: Phaser.Scene;
  private readonly zoom: number;

  // Nivel
  private readonly levelLabel:  Phaser.GameObjects.Text;
  private readonly levelNumber: Phaser.GameObjects.Text;
  private readonly levelXpBg:   Phaser.GameObjects.Rectangle;
  private readonly levelXpFill: Phaser.GameObjects.Rectangle;
  private readonly levelXpMaxW: number;

  // Score
  private readonly scoreText: Phaser.GameObjects.Text;

  // Mace cooldown
  private readonly maceLabel:   Phaser.GameObjects.Text;
  private readonly maceCdBg:    Phaser.GameObjects.Rectangle;
  private readonly maceCdFill:  Phaser.GameObjects.Rectangle;
  private readonly maceCdText:  Phaser.GameObjects.Text;
  private readonly maceCdMaxW:  number;

  // Estado de la bandera
  private readonly flagStatusText: Phaser.GameObjects.Text;

  // Poder activo
  private readonly powerLabel:     Phaser.GameObjects.Text;
  private readonly powerIcon:      Phaser.GameObjects.Text;
  private readonly powerTimerText: Phaser.GameObjects.Text;
  private readonly powerBarBg:     Phaser.GameObjects.Rectangle;
  private readonly powerBarFill:   Phaser.GameObjects.Rectangle;
  private readonly powerBarMaxW:   number;

  // Toast de nivel (centro pantalla)
  private readonly levelUpText: Phaser.GameObjects.Text;
  private levelUpEnd  = 0;
  private prevLevel   = 1;

  // Leaderboard panel
  private readonly lbBg:         Phaser.GameObjects.Rectangle;
  private readonly lbTotalText:  Phaser.GameObjects.Text;
  private readonly lbTitle:      Phaser.GameObjects.Text;
  private readonly lbRows:       Phaser.GameObjects.Text[];
  private readonly lbMyRankRow:  Phaser.GameObjects.Text;

  // Event feed (reemplaza kill feed — mazos, banderas, etc.)
  private readonly feedRows: Phaser.GameObjects.Text[];
  private readonly FEED_MAX = 5;
  private readonly FEED_TTL = 4000;
  private feedQueue: { text: string; color: string; expiresAt: number }[] = [];

  // Hints
  private readonly hintsText: Phaser.GameObjects.Text;
  private hintsEnd = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly isMobile = false,
    private readonly t: TranslateFn = (k) => k,
  ) {
    this.scene = scene;
    const mono = 'monospace';
    const W = scene.scale.width;
    const H = scene.scale.height;
    const PAD = 16;

    const z = scene.cameras.main.zoom || 1;
    this.zoom = z;

    const cx = W / 2, cy = H / 2;
    const px = (sx: number) => cx + (sx - cx) / z;
    const py = (sy: number) => cy + (sy - cy) / z;
    const ps = (n: number) => Math.round(n / z);

    // ── NIVEL (arriba-izquierda) ─────────────────────────────────────────────
    this.levelLabel = scene.add.text(px(PAD), py(PAD), 'NIVEL',
      { fontFamily: mono, fontSize: `${ps(10)}px`, color: '#888888' })
      .setScrollFactor(0).setDepth(100);

    this.levelNumber = scene.add.text(px(PAD), py(PAD + 12), 'L1',
      { fontFamily: mono, fontSize: `${ps(28)}px`, color: '#6b7280', fontStyle: 'bold' })
      .setScrollFactor(0).setDepth(100);

    // Barra de XP (progreso hacia siguiente nivel)
    const xpMaxW = ps(70);
    this.levelXpMaxW = xpMaxW;
    this.levelXpBg = scene.add.rectangle(px(PAD), py(PAD + 48), xpMaxW, ps(4), 0x1f2937)
      .setScrollFactor(0).setDepth(100).setOrigin(0, 0.5);
    this.levelXpFill = scene.add.rectangle(px(PAD), py(PAD + 48), xpMaxW, ps(4), 0x4a6fa5)
      .setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

    // ── SCORE ────────────────────────────────────────────────────────────────
    this.scoreText = scene.add.text(px(PAD), py(PAD + 58), '⚡ 0',
      { fontFamily: mono, fontSize: `${ps(13)}px`, color: '#f59e0b' })
      .setScrollFactor(0).setDepth(100);

    // ── MAZO COOLDOWN ─────────────────────────────────────────────────────────
    this.maceLabel = scene.add.text(px(PAD), py(PAD + 80), 'MAZO',
      { fontFamily: mono, fontSize: `${ps(10)}px`, color: '#888888' })
      .setScrollFactor(0).setDepth(100);

    const cdMaxW = ps(70);
    this.maceCdMaxW = cdMaxW;
    this.maceCdBg = scene.add.rectangle(px(PAD), py(PAD + 92), cdMaxW, ps(6), 0x1f2937)
      .setScrollFactor(0).setDepth(100).setOrigin(0, 0.5);
    this.maceCdFill = scene.add.rectangle(px(PAD), py(PAD + 92), cdMaxW, ps(6), 0x00e5ff)
      .setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);
    this.maceCdText = scene.add.text(px(PAD), py(PAD + 102), 'LISTO',
      { fontFamily: mono, fontSize: `${ps(10)}px`, color: '#00e5ff' })
      .setScrollFactor(0).setDepth(100);

    // ── ESTADO BANDERA (centro-arriba) ────────────────────────────────────────
    this.flagStatusText = scene.add.text(px(W / 2), py(PAD), '',
      { fontFamily: mono, fontSize: `${ps(13)}px`, color: '#f59e0b',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: ps(3) })
      .setScrollFactor(0).setDepth(100).setOrigin(0.5, 0).setVisible(false);

    // ── PODER ACTIVO ─────────────────────────────────────────────────────────
    this.powerLabel = scene.add.text(px(PAD), py(PAD + 118), 'PODER',
      { fontFamily: mono, fontSize: `${ps(10)}px`, color: '#888888' })
      .setScrollFactor(0).setDepth(100).setVisible(false);
    this.powerIcon = scene.add.text(px(PAD), py(PAD + 130), '',
      { fontFamily: mono, fontSize: `${ps(18)}px` })
      .setScrollFactor(0).setDepth(100).setVisible(false);
    this.powerTimerText = scene.add.text(px(PAD + 28), py(PAD + 133), '',
      { fontFamily: mono, fontSize: `${ps(11)}px`, color: '#ffffff' })
      .setScrollFactor(0).setDepth(100).setVisible(false);

    const pbMaxW = ps(70);
    this.powerBarMaxW = pbMaxW;
    this.powerBarBg = scene.add.rectangle(px(PAD), py(PAD + 150), pbMaxW, ps(4), 0x333333)
      .setScrollFactor(0).setDepth(100).setOrigin(0, 0.5).setVisible(false);
    this.powerBarFill = scene.add.rectangle(px(PAD), py(PAD + 150), pbMaxW, ps(4), 0x00e5ff)
      .setScrollFactor(0).setDepth(101).setOrigin(0, 0.5).setVisible(false);

    // ── TOAST NIVEL-UP ────────────────────────────────────────────────────────
    this.levelUpText = scene.add.text(px(W / 2), py(H / 2 - 60), '',
      { fontFamily: mono, fontSize: `${ps(20)}px`, color: '#f1c40f',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: ps(4) })
      .setScrollFactor(0).setDepth(110).setOrigin(0.5).setAlpha(0);

    // ── LEADERBOARD (top-derecha) ─────────────────────────────────────────────
    const lbScreenW   = 200;
    const lbScreenPad = 8;
    const lbX    = px(W - lbScreenW - PAD);
    const lbBgX  = px(W - lbScreenW - PAD - lbScreenPad);
    const lbBgW  = ps(lbScreenW + lbScreenPad * 2);
    const lbAlpha = isMobile ? 0.08 : 0.55;

    this.lbBg = scene.add.rectangle(lbBgX, py(PAD - lbScreenPad), lbBgW, ps(192), 0x000000, lbAlpha)
      .setScrollFactor(0).setDepth(99).setOrigin(0, 0);

    this.lbTotalText = scene.add.text(lbX, py(PAD), '',
      { fontFamily: mono, fontSize: `${ps(10)}px`, color: '#666666' })
      .setScrollFactor(0).setDepth(100);

    this.lbTitle = scene.add.text(lbX, py(PAD + 13), 'DARK FLAG',
      { fontFamily: mono, fontSize: `${ps(13)}px`, color: '#f59e0b' })
      .setScrollFactor(0).setDepth(100);

    this.lbRows = [];
    for (let i = 0; i < 10; i++) {
      const row = scene.add.text(lbX, py(PAD + 30 + i * 14), '',
        { fontFamily: mono, fontSize: `${ps(11)}px`, color: '#cccccc' })
        .setScrollFactor(0).setDepth(100);
      this.lbRows.push(row);
    }

    this.lbMyRankRow = scene.add.text(lbX, py(PAD + 158), '',
      { fontFamily: mono, fontSize: `${ps(11)}px`, color: '#aaaaff', fontStyle: 'italic' })
      .setScrollFactor(0).setDepth(100).setVisible(false);

    // ── EVENT FEED ────────────────────────────────────────────────────────────
    const kfX = px(W - lbScreenW - PAD);
    const kfStartY = py(PAD + 182);
    this.feedRows = [];
    for (let i = 0; i < this.FEED_MAX; i++) {
      const row = scene.add.text(kfX, kfStartY + ps(i * 13), '',
        { fontFamily: mono, fontSize: `${ps(10)}px`, color: '#cccccc' })
        .setScrollFactor(0).setDepth(100).setAlpha(0);
      this.feedRows.push(row);
    }

    // ── HINTS ────────────────────────────────────────────────────────────────
    const hintsMsg = isMobile
      ? '⚡mazo  🔦luz  💫pulso'
      : 'E=mazo  L=linterna  F=pulso';
    this.hintsText = scene.add.text(px(W / 2), py(H - PAD), hintsMsg,
      { fontFamily: mono, fontSize: `${ps(12)}px`, color: '#555566', align: 'center' })
      .setScrollFactor(0).setDepth(100).setOrigin(0.5, 1);
    this.hintsEnd = scene.time.now + 8000;

    scene.scale.on('resize', this.onResize, this);
  }

  private onResize(size: Phaser.Structs.Size): void {
    const nW = size.width, nH = size.height;
    const z = this.zoom;
    const PAD = 16;
    const ncx = nW / 2, ncy = nH / 2;
    const px = (sx: number) => ncx + (sx - ncx) / z;
    const py = (sy: number) => ncy + (sy - ncy) / z;

    this.levelLabel.setPosition(px(PAD), py(PAD));
    this.levelNumber.setPosition(px(PAD), py(PAD + 12));
    this.levelXpBg.setPosition(px(PAD), py(PAD + 48));
    this.levelXpFill.setPosition(px(PAD), py(PAD + 48));
    this.scoreText.setPosition(px(PAD), py(PAD + 58));
    this.maceLabel.setPosition(px(PAD), py(PAD + 80));
    this.maceCdBg.setPosition(px(PAD), py(PAD + 92));
    this.maceCdFill.setPosition(px(PAD), py(PAD + 92));
    this.maceCdText.setPosition(px(PAD), py(PAD + 102));
    this.flagStatusText.setPosition(px(nW / 2), py(PAD));
    this.powerLabel.setPosition(px(PAD), py(PAD + 118));
    this.powerIcon.setPosition(px(PAD), py(PAD + 130));
    this.powerTimerText.setPosition(px(PAD + 28), py(PAD + 133));
    this.powerBarBg.setPosition(px(PAD), py(PAD + 150));
    this.powerBarFill.setPosition(px(PAD), py(PAD + 150));
    this.levelUpText.setPosition(px(nW / 2), py(nH / 2 - 60));

    const lbX   = px(nW - 200 - PAD);
    const lbBgX = px(nW - 200 - PAD - 8);
    this.lbBg.setPosition(lbBgX, py(PAD - 8));
    this.lbTotalText.setPosition(lbX, py(PAD));
    this.lbTitle.setPosition(lbX, py(PAD + 13));
    for (let i = 0; i < this.lbRows.length; i++) {
      this.lbRows[i].setPosition(lbX, py(PAD + 30 + i * 14));
    }
    this.lbMyRankRow.setPosition(lbX, py(PAD + 158));
    this.hintsText.setPosition(px(nW / 2), py(nH - PAD));
  }

  update(
    score: number,
    level: number,
    maceCooldownRemaining: number,
    hasFlag: boolean,
    time: number,
    leaderboard: LeaderboardEntry[],
    totalPlayers: number,
    myRank: number,
    myId: string,
    activePower: PowerUpType | null,
    powerExpiresAt: number,
  ): void {
    // ── Nivel + XP bar ───────────────────────────────────────────────────────
    const levelColor = `#${getLevelColor(level).toString(16).padStart(6, '0')}`;
    this.levelNumber.setText(`L${level}`).setColor(levelColor);

    const scoreInLevel = score % 50;
    const xpPct = scoreInLevel / 50;
    this.levelXpFill.setSize(this.levelXpMaxW * xpPct, this.levelXpFill.height)
      .setFillStyle(getLevelColor(level));

    // ── Score ────────────────────────────────────────────────────────────────
    this.scoreText.setText(`⚡ ${score}`);

    // ── Mazo cooldown ─────────────────────────────────────────────────────────
    if (maceCooldownRemaining <= 0) {
      this.maceCdFill.setSize(this.maceCdMaxW, this.maceCdFill.height).setFillStyle(0x00e5ff);
      this.maceCdText.setText('LISTO').setColor('#00e5ff');
    } else {
      const pct = 1 - maceCooldownRemaining / GAME.MACE_COOLDOWN_MS;
      this.maceCdFill.setSize(this.maceCdMaxW * pct, this.maceCdFill.height).setFillStyle(0xff6d00);
      const secs = Math.ceil(maceCooldownRemaining / 1000);
      this.maceCdText.setText(`${secs}s`).setColor('#ff6d00');
    }

    // ── Estado bandera ────────────────────────────────────────────────────────
    if (hasFlag) {
      this.flagStatusText.setText('🚩 LLEVAR A DESTINO').setVisible(true);
    } else {
      this.flagStatusText.setVisible(false);
    }

    // ── Toast nivel-up ────────────────────────────────────────────────────────
    if (level > this.prevLevel) {
      this.levelUpText.setText(`¡NIVEL ${level}!`).setAlpha(1);
      this.levelUpEnd = time + 2500;
    }
    this.prevLevel = level;
    if (this.levelUpText.alpha > 0 && time > this.levelUpEnd) {
      this.levelUpText.setAlpha(Math.max(0, this.levelUpText.alpha - 0.04));
    }

    // ── Poder activo ─────────────────────────────────────────────────────────
    const hasPower = activePower !== null;
    this.powerLabel.setVisible(hasPower);
    this.powerIcon.setVisible(hasPower);
    this.powerTimerText.setVisible(hasPower);

    if (hasPower) {
      const icon     = POWER_ICONS[activePower] ?? '?';
      const colHex   = POWER_COLORS[activePower] ?? 0xffffff;
      const colStr   = `#${colHex.toString(16).padStart(6, '0')}`;
      const remaining = Math.max(0, powerExpiresAt - time);
      const barPct    = remaining / POWER_DURATION_MS;
      const secs      = Math.ceil(remaining / 1000);
      this.powerIcon.setText(icon);
      this.powerTimerText.setText(`${secs}s`).setColor(colStr);
      this.powerBarBg.setVisible(true);
      this.powerBarFill.setVisible(true);
      this.powerBarFill.setSize(this.powerBarMaxW * barPct, this.powerBarFill.height)
        .setFillStyle(colHex);
    } else {
      this.powerBarBg.setVisible(false);
      this.powerBarFill.setVisible(false);
    }

    // ── Leaderboard ───────────────────────────────────────────────────────────
    this.lbTotalText.setText(`${totalPlayers} jugadores`);

    for (let i = 0; i < this.lbRows.length; i++) {
      const entry = leaderboard[i];
      if (entry) {
        const prefix = `${entry.rank}.`;
        const name   = entry.username.slice(0, 9).padEnd(9);
        this.lbRows[i].setText(`${prefix} ${name}  ⚡${entry.score}`);
        this.lbRows[i].setColor(entry.id === myId ? '#f59e0b' : '#cccccc');
      } else {
        this.lbRows[i].setText('');
      }
    }

    const inTop = leaderboard.some(e => e.id === myId);
    if (!inTop && myRank > 0) {
      this.lbMyRankRow.setText(`#${myRank} tú — ⚡${score}`).setVisible(true);
    } else {
      this.lbMyRankRow.setVisible(false);
    }

    // ── Event feed ────────────────────────────────────────────────────────────
    this.feedQueue = this.feedQueue.filter(e => e.expiresAt > time);
    for (let i = 0; i < this.feedRows.length; i++) {
      const entry = this.feedQueue[i];
      if (entry) {
        const remaining = entry.expiresAt - time;
        const alpha = remaining < 1000 ? remaining / 1000 : 1;
        this.feedRows[i].setText(entry.text).setColor(entry.color).setAlpha(alpha);
      } else {
        this.feedRows[i].setAlpha(0);
      }
    }

    // ── Hints ─────────────────────────────────────────────────────────────────
    if (time > this.hintsEnd) this.hintsText.setVisible(false);
  }

  pushFeedEvent(text: string, color = '#cccccc'): void {
    this.feedQueue.push({ text, color, expiresAt: this.scene.time.now + this.FEED_TTL });
    if (this.feedQueue.length > this.FEED_MAX) this.feedQueue.shift();
  }
}
