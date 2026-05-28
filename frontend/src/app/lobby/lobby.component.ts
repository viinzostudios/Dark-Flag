import {
  Component, OnInit, OnDestroy, inject, signal,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GameSocketService, RoomJoinedEvent } from '../core/services/game-socket.service';
import { AuthService } from '../core/services/auth.service';
import { SkinsService, Skin, SkinProgression } from '../core/services/skins.service';
import { ArenaSkinService, ArenaSkinItem } from '../core/services/arena-skin.service';
import { AvatarsService } from '../core/services/avatars.service';
import { BannerAdComponent } from '../shared/components/banner-ad.component';
import { SideAdComponent } from '../shared/components/side-ad.component';
import { PreEntryOverlayComponent } from './pre-entry-overlay.component';
import { DailyRewardComponent } from './daily-reward.component';
import { RegisterPromptComponent } from '../shared/components/register-prompt.component';
import { RankingsModalComponent } from './rankings-modal.component';
import { AvatarPickerComponent } from '../shared/components/avatar-picker.component';
import { MobileFullscreenService } from '../core/services/mobile-fullscreen.service';
import { AdsService } from '../core/services/ads.service';
import { LangSelectorComponent } from '../shared/components/lang-selector.component';
import { TutorialModalComponent } from '../shared/components/tutorial-modal.component';
import { environment } from '../../environments/environment';

type LobbyState = 'idle' | 'searching' | 'found';

const RARITY_COLOR: Record<string, string> = {
  common: '#9e9e9e',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
};

interface LevelInfo {
  n: number;
  color: string;
  perk: string;
  tag: string;
  yellow?: boolean;
  toxic?: boolean;
  radio?: boolean;
}

const LEVEL_DATA: LevelInfo[] = [
  { n: 1,  color: '#2ecc71', perk: '+8% velocidad  ·  +1 HP (3 HP total)',                     tag: 'VEL+HP'   },
  { n: 2,  color: '#27ae60', perk: '+8% velocidad adicional (total +16%)',                      tag: 'VEL'      },
  { n: 3,  color: '#1abc9c', perk: '+8% velocidad adicional (total +24%, máximo)',              tag: 'VEL'      },
  { n: 4,  color: '#3498db', perk: '+2 HP al subir de nivel (4 HP total)',                       tag: 'HP'       },
  { n: 5,  color: '#2980b9', perk: 'Cañón +15% · balas más grandes',                           tag: 'CAÑÓN'    },
  { n: 6,  color: '#9b59b6', perk: '+2 HP al subir de nivel (5 HP total)',                       tag: 'HP'       },
  { n: 7,  color: '#8e44ad', perk: 'Cañón +30% · balas aún más grandes',                       tag: 'CAÑÓN'    },
  { n: 8,  color: '#e67e22', perk: 'Balas +30% velocidad — más difíciles de esquivar',          tag: 'VEL-BALA' },
  { n: 9,  color: '#d35400', perk: 'Disparo 25% más rápido (cooldown 300 → 225 ms)',            tag: 'CADENCIA' },
  { n: 10, color: '#e74c3c', perk: '+1 rebote extra (máximo 4 rebotes)',                        tag: 'REBOTE',  yellow: true },
  { n: 11, color: '#c0392b', perk: '+2 HP al subir de nivel (6 HP total)',                       tag: 'HP',      yellow: true },
  { n: 12, color: '#922b21', perk: '+2 HP al subir de nivel (7 HP total)',                       tag: 'HP',      yellow: true },
  { n: 13, color: '#00e676', perk: '☢ Balas tóxicas — cada impacto quita 2 HP',                tag: '2 DMG',   yellow: true, toxic: true },
  { n: 14, color: '#00c853', perk: '☢ Radioactivo — al chocar: rival rebota y pierde 1 HP. Si ambos son nv.14, ambos reciben el efecto', tag: 'RADIO', yellow: true, toxic: true },
  { n: 15, color: '#00ff41', perk: '⚡ Doble disparo — 2 balas paralelas · Cada 10 kills recuperas 1 ❤ (cada 20 kills si llevas más de 100 kills en nv.15)', tag: 'DOBLE', radio: true },
];

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [TranslateModule, LangSelectorComponent, BannerAdComponent, SideAdComponent, PreEntryOverlayComponent, DailyRewardComponent, RegisterPromptComponent, RankingsModalComponent, AvatarPickerComponent, TutorialModalComponent],
  template: `
    <div class="lobby" (touchstart)="fullscreen.requestFullscreen()">
      <!-- Header -->
      <header class="header">
        <div class="logo">
          <span class="logo-icon">🏳️</span>
          <span class="logo-text">DARK FLAG</span>
        </div>
        <div class="user-bar">
          @if (username()) {
            <span class="user-chip">👤 {{ username() }}</span>
          }
          @if (isLoggedIn()) {
            <span class="coins-chip">🪙 {{ coins() }}</span>
          }
          <button class="nav-btn" (click)="requestStats()">📊 {{ 'lobby.menu_stats' | translate }}</button>
          <button class="nav-btn" (click)="requestShopNav()">🛒 {{ 'lobby.menu_shop' | translate }}</button>
          <button class="nav-btn" (click)="openRankings()">🏆 {{ 'lobby.menu_rankings' | translate }}</button>
          <app-lang-selector variant="header" />
          @if (isLoggedIn()) {
            <button class="nav-btn logout-btn" (click)="logout()">{{ 'lobby.menu_logout' | translate }}</button>
          } @else {
            <button class="nav-btn" (click)="goLogin()">{{ 'lobby.menu_login' | translate }}</button>
          }
        </div>
        <!-- Hamburger solo visible en mobile -->
        <button class="mobile-hamburger" (click)="mobileMenuOpen.set(!mobileMenuOpen())"
                [class.is-open]="mobileMenuOpen()" aria-label="Menú">
          <span></span><span></span><span></span>
        </button>
      </header>

      <!-- Banner Ad -->
      <div class="ad-strip">
        <app-banner-ad />
      </div>

      <!-- Daily Reward -->
      @if (isLoggedIn()) {
        <div class="daily-strip">
          <app-daily-reward (onClaimed)="onDailyRewardClaimed($event)" />
        </div>
      }

      <!-- Mobile: fila jugador compacta (solo visible en mobile) -->
      <div class="mobile-player-row">
        <div class="mobile-avatar" (click)="openAvatarPicker()">
          <img [src]="avatarUrl()" (error)="onAvatarImgErr($event)" alt="avatar" class="mobile-avatar-img">
          <div class="mobile-avatar-edit">✎</div>
        </div>
        <div class="mobile-alias-area">
          <input class="alias-input" [value]="username()" (input)="onAliasChange($event)"
                 maxlength="20" [placeholder]="'lobby.alias_placeholder' | translate" />
          <span class="alias-hint">{{ isLoggedIn() ? ('lobby.account_label' | translate) + (accountName() || '') : ('lobby.anonymous_mode' | translate) }}</span>
        </div>
        <div class="mobile-status">
          <span class="dot"></span>
          <span>{{ 'lobby.online' | translate }}</span>
        </div>
      </div>

      <!-- Guest promo -->
      @if (!isLoggedIn()) {
        <div class="guest-promo">
          <div class="guest-promo-inner">
            <div class="promo-benefits">
              <span class="promo-benefit">{{ 'lobby.promo_stat' | translate }}</span>
              <span class="promo-benefit">{{ 'lobby.promo_coins' | translate }}</span>
              <span class="promo-benefit">{{ 'lobby.promo_skins' | translate }}</span>
              <span class="promo-benefit">{{ 'lobby.promo_ranking' | translate }}</span>
            </div>
            <div class="promo-actions">
              <button class="promo-btn promo-btn-register" (click)="goRegister()">{{ 'lobby.promo_register' | translate }}</button>
              <button class="promo-btn promo-btn-login" (click)="goLogin()">{{ 'lobby.promo_login' | translate }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Main + side ads -->
      <div class="main-row">
        <!-- Ad izquierdo: pegado al borde exterior de pantalla -->
        <div class="lobby-ad-col lobby-ad-col--left"><app-side-ad /></div>
        <!-- Columna central: main grid + skins section -->
        <div class="lobby-center">
        <main class="main">
        <!-- Left: player card + stats -->
        <aside class="panel player-panel">
          <!-- Mobile only: compact skin access -->
          <div class="mobile-skin-side">
            <div class="side-label">{{ 'lobby.mobile_label_skin' | translate }}</div>
            <div class="side-preview"
                 [style.background]="activeSkin() ? activeSkin()!.bodyColor + '33' : '#4a90d933'"
                 [style.box-shadow]="activeSkin() ? '0 0 10px ' + activeSkin()!.bodyColor + '55' : '0 0 10px #4a90d955'">
              @if (activeSkin()) {
                <img class="side-skin-img"
                     [src]="'/assets/tanks/skins/tank-' + skinSlug(activeSkin()!.name) + '-body.png'"
                     [alt]="activeSkin()!.name"
                     (error)="onImgError($event, activeSkin()!.bodyColor)">
              }
            </div>
            <span class="side-item-name">{{ activeSkin() ? skinName(activeSkin()!.name) : ('lobby.skin_base_name' | translate) }}</span>
            <button class="side-change-btn" (click)="requestShop()">{{ 'lobby.mobile_change' | translate }}</button>
          </div>
          <div class="panel-header">{{ 'lobby.player_panel_header' | translate }}</div>
          <div class="avatar-ring" (click)="openAvatarPicker()" title="Cambiar avatar">
            <img class="avatar-img"
                 [src]="avatarUrl()"
                 alt="Avatar"
                 (error)="onAvatarImgErr($event)">
            <div class="avatar-edit-hint">✎</div>
          </div>
          <div class="alias-wrap">
            <input
              class="alias-input"
              [value]="username()"
              (input)="onAliasChange($event)"
              maxlength="20"
              [placeholder]="'lobby.alias_placeholder' | translate"
              [attr.aria-label]="'lobby.alias_placeholder' | translate"
            />
            <span class="alias-hint">{{ isLoggedIn() ? ('lobby.account_label' | translate) + (accountName() || '') : ('lobby.anonymous_mode' | translate) }}</span>
          </div>
          <div class="status-dot">
            <span class="dot"></span>
            <span>{{ 'lobby.in_line_label' | translate }}</span>
          </div>

          <div class="divider"></div>

          <div class="panel-header">{{ 'lobby.last_session_header' | translate }}</div>
          <div class="stat-row"><span>{{ 'lobby.stat_points' | translate }}</span><span class="stat-val">{{ lastScore() }}</span></div>
          <div class="stat-row"><span>{{ 'lobby.stat_time' | translate }}</span><span class="stat-val">{{ lastTime() }}</span></div>
        </aside>

        <!-- Center: play button -->
        <section class="center">
          <div class="arena-preview">
            <div class="grid-anim"></div>
            <div class="play-content">
              <p class="arena-label">{{ 'lobby.area_label' | translate }}</p>
              <button
                class="play-btn"
                [class.searching]="state() === 'searching'"
                [disabled]="state() !== 'idle'"
                (click)="findGame()"
              >
                <span class="play-icon">
                  {{ state() === 'idle' ? '⚡' : state() === 'searching' ? '⟳' : '✓' }}
                </span>
                <span class="play-label">
                  {{ state() === 'idle' ? ('lobby.play_btn' | translate)
                    : state() === 'searching' ? ('lobby.searching' | translate)
                    : ('lobby.room_found' | translate) }}
                </span>
              </button>
              @if (state() === 'idle') {
                <p class="play-hint">{{ 'lobby.play_hint' | translate }}</p>
                <div class="join-code-row">
                  @if (!showJoinCode()) {
                    <button class="join-code-toggle" (click)="showJoinCode.set(true)">
                      {{ 'lobby.join_code_btn' | translate }}
                    </button>
                  } @else {
                    <input
                      class="join-code-input"
                      type="text"
                      [placeholder]="'lobby.join_code_placeholder' | translate"
                      maxlength="40"
                      [value]="roomCodeInput()"
                      (input)="roomCodeInput.set($any($event.target).value)"
                      (keydown.enter)="joinWithCode()"
                    />
                    <button class="join-code-btn" (click)="joinWithCode()">{{ 'lobby.join_btn' | translate }}</button>
                  }
                </div>
              }
              <!-- Mobile: controles táctiles -->
              <div class="mobile-touch-hint">
                <span class="touch-item">{{ 'lobby.touch_move' | translate }}</span>
                <span class="touch-item">{{ 'lobby.touch_shoot' | translate }}</span>
                <span class="touch-item">{{ 'lobby.touch_wall_front' | translate }}</span>
                <span class="touch-item">{{ 'lobby.touch_wall_back' | translate }}</span>
              </div>
              <button class="mobile-levels-btn-sm" (click)="showLevels.set(true)">{{ 'lobby.levels_btn' | translate }}</button>
            </div>
          </div>
        </section>

        <!-- Right: info -->
        <aside class="panel info-panel">
          <!-- Mobile only: compact arena access -->
          <div class="mobile-arena-side">
            <div class="side-label">{{ 'lobby.mobile_label_arena' | translate }}</div>
            <div class="side-preview side-arena-preview"
                 [style.background-image]="activeArenaThumb()"
                 [style.background-size]="'cover'"
                 [style.background-position]="'center'">
            </div>
            <span class="side-item-name">{{ activeArenaName() }}</span>
            <button class="side-change-btn" (click)="requestShopArenas()">{{ 'lobby.mobile_change' | translate }}</button>
          </div>
          <div class="panel-header">{{ 'lobby.mode_header' | translate }}</div>
          <div class="mode-card">
            <p class="mode-name">{{ 'lobby.mode_name' | translate }}</p>
            <p class="mode-desc">{{ 'lobby.mode_desc' | translate }}</p>
          </div>

          <div class="divider"></div>

          <div class="panel-header">{{ 'lobby.controls_header' | translate }}</div>
          <div class="control-row"><kbd>Mouse</kbd><span>{{ 'lobby.ctrl_move' | translate }}</span></div>
          <div class="control-row"><kbd>Clic izq / E</kbd><span>{{ 'lobby.ctrl_shoot' | translate }}</span></div>
          <div class="control-row"><kbd>W / Clic der</kbd><span>{{ 'lobby.ctrl_wall_front' | translate }}</span></div>
          <div class="control-row"><kbd>Q</kbd><span>{{ 'lobby.ctrl_wall_back' | translate }}</span></div>
          <div class="control-row"><kbd>Espacio</kbd><span>{{ 'lobby.ctrl_brake' | translate }}</span></div>

          <div class="divider"></div>

          <button class="levels-btn" (click)="showLevels.set(true)">
            {{ 'lobby.levels_btn' | translate }}
          </button>
        </aside>
      </main>
        <!-- Tank skins section (dentro de lobby-center para respetar el max-width) -->
        <section class="skins-section">
        <div class="skins-inner">

            <!-- Active skin -->
            <div class="skin-active-card">
              <div class="skin-label">{{ 'lobby.skin_active_label' | translate }}</div>
              @if (activeSkin()) {
                <div class="skin-preview-wrap">
                  <div class="tank-preview"
                       [style.background]="activeSkin()!.bodyColor + '33'"
                       [style.box-shadow]="'0 0 18px ' + activeSkin()!.bodyColor + '66'">
                    <img class="skin-preview-img"
                         [src]="'/assets/tanks/skins/tank-' + skinSlug(activeSkin()!.name) + '-body.png'"
                         [alt]="activeSkin()!.name"
                         (error)="onImgError($event, activeSkin()!.bodyColor)">
                    <img class="skin-cannon-overlay"
                         [src]="'/assets/tanks/skins/tank-' + skinSlug(activeSkin()!.name) + '-cannon.png'"
                         [alt]="''">
                  </div>
                  <div class="skin-info">
                    <span class="skin-name">{{ skinName(activeSkin()!.name) }}</span>
                    <span class="skin-rarity" [style.color]="rarityColor(activeSkin()!.rarity)">
                      {{ rarityLabel(activeSkin()!.rarity) }}
                    </span>
                    @if (bonusSummary(activeSkin()!)) {
                      <span class="skin-bonus">{{ bonusSummary(activeSkin()!) }}</span>
                    }
                  </div>
                </div>
              } @else {
                <div class="skin-preview-wrap">
                  <div class="tank-preview skin-base"
                       style="background:#4a90d9; box-shadow:0 0 18px #4a90d966;">
                    <div class="tank-cannon" style="background:#2c5f8a;"></div>
                  </div>
                  <div class="skin-info">
                    <span class="skin-name">{{ 'lobby.skin_base_name' | translate }}</span>
                    <span class="skin-rarity" style="color:#9e9e9e">{{ 'lobby.skin_base_rarity' | translate }}</span>
                  </div>
                </div>
              }
              <button class="skin-change-btn" (click)="requestShop()">{{ 'lobby.skin_change' | translate }}</button>
            </div>

            <!-- Progress to next free skin -->
            <div class="skin-progress-card">
              <div class="skin-label">{{ 'lobby.skin_next_free_label' | translate }}</div>

              @if (skinLoading()) {
                <div class="progress-loading">{{ 'lobby.loading' | translate }}</div>
              } @else if (progression()?.nextFreeSkin) {
                <div class="next-skin-row">
                  <div class="tank-preview-sm"
                       [style.background]="progression()!.nextFreeSkin!.bodyColor + '33'"
                       [style.box-shadow]="'0 0 12px ' + progression()!.nextFreeSkin!.bodyColor + '55'">
                    <img class="skin-preview-img"
                         [src]="'/assets/tanks/skins/tank-' + skinSlug(progression()!.nextFreeSkin!.name) + '-body.png'"
                         [alt]="progression()!.nextFreeSkin!.name"
                         (error)="onImgError($event, progression()!.nextFreeSkin!.bodyColor)">
                    <img class="skin-cannon-overlay"
                         [src]="'/assets/tanks/skins/tank-' + skinSlug(progression()!.nextFreeSkin!.name) + '-cannon.png'"
                         [alt]="''">
                  </div>
                  <div class="next-skin-info">
                    <span class="next-skin-name">{{ skinName(progression()!.nextFreeSkin!.name) }}</span>
                    <span class="next-skin-rarity"
                          [style.color]="rarityColor(progression()!.nextFreeSkin!.rarity)">
                      {{ rarityLabel(progression()!.nextFreeSkin!.rarity) }}
                    </span>
                  </div>
                </div>

                <!-- Progress bar (based on play time — exact amount hidden) -->
                <div class="progress-bar-wrap">
                  <div class="progress-bar-track">
                    <div class="progress-bar-fill"
                         [style.width]="progression()!.nextFreeSkin!.progressPercent + '%'"
                         [style.background]="rarityColor(progression()!.nextFreeSkin!.rarity)">
                    </div>
                  </div>
                  <span class="progress-pct">{{ progression()!.nextFreeSkin!.progressPercent }}%</span>
                </div>
              } @else if (progression()) {
                <p class="all-unlocked">{{ 'lobby.all_unlocked' | translate }}</p>
              }

              <!-- Claimable skins -->
              @if (progression()?.claimableSkins?.length) {
                <div class="claimable-section">
                  <span class="claimable-label">
                    {{ 'lobby.claimable_label' | translate : { count: progression()!.claimableSkins.length } }}
                  </span>
                  <div class="claimable-row">
                    @for (s of progression()!.claimableSkins; track s.id) {
                      <div class="claimable-item"
                           [style.background]="s.bodyColor + '22'"
                           [style.border-color]="rarityColor(s.rarity) + '66'">
                        <div class="tank-preview-xs"
                             [style.background]="s.bodyColor + '33'"
                             [style.box-shadow]="'0 0 8px ' + s.bodyColor + '55'">
                          <img class="skin-preview-img"
                               [src]="'/assets/tanks/skins/tank-' + skinSlug(s.name) + '-body.png'"
                               [alt]="s.name"
                               (error)="onImgError($event, s.bodyColor)">
                          <img class="skin-cannon-overlay"
                               [src]="'/assets/tanks/skins/tank-' + skinSlug(s.name) + '-cannon.png'"
                               [alt]="''">
                        </div>
                        <span class="claimable-name">{{ skinName(s.name) }}</span>
                        <button class="claim-btn" (click)="claimSkin(s.id)" [disabled]="claiming()">
                          {{ 'lobby.claim_btn' | translate }}
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Arena skin activa -->
            <div class="skin-active-card">
              <div class="skin-label">{{ 'lobby.arena_active_label' | translate }}</div>
              <div class="skin-preview-wrap">
                <div class="arena-lobby-thumb"
                     [style.background-image]="activeArenaThumb()"
                     [style.background-size]="'cover'"
                     [style.background-position]="'center'">
                </div>
                <div class="skin-info">
                  <span class="skin-name">{{ activeArenaName() }}</span>
                  <span class="skin-rarity" style="color:#9e9e9e">
                    {{ activeArenaSlug() === 'default' ? ('lobby.arena_free' | translate) : ('lobby.arena_premium' | translate) }}
                  </span>
                </div>
              </div>
              <button class="skin-change-btn" (click)="requestShopArenas()">{{ 'lobby.arena_change' | translate }}</button>
            </div>

          </div>
        </section>
          <!-- Mobile only: barra inferior de skin/arena (reemplaza skins-section en mobile) -->
          <div class="mobile-bottom-bar">
            <div class="mbb-panel mbb-skin">
              <div class="mbb-label">{{ 'lobby.mobile_label_skin' | translate }}</div>
              <div class="mbb-preview"
                   [style.background]="activeSkin() ? activeSkin()!.bodyColor + '33' : '#4a90d933'"
                   [style.box-shadow]="activeSkin() ? '0 0 8px ' + activeSkin()!.bodyColor + '55' : '0 0 8px #4a90d955'">
                @if (activeSkin()) {
                  <img class="mbb-skin-img"
                       [src]="'/assets/tanks/skins/tank-' + skinSlug(activeSkin()!.name) + '-body.png'"
                       [alt]="activeSkin()!.name"
                       (error)="onImgError($event, activeSkin()!.bodyColor)">
                }
              </div>
              <span class="mbb-name">{{ activeSkin() ? skinName(activeSkin()!.name) : ('shop.default_arena_name' | translate) }}</span>
              <button class="mbb-btn" (click)="requestShop()">{{ 'lobby.skin_change' | translate }}</button>
            </div>

            <div class="mbb-panel mbb-next">
              <div class="mbb-label">{{ 'lobby.mobile_label_next' | translate }}</div>
              @if (skinLoading()) {
                <div class="mbb-loading">{{ 'lobby.loading' | translate }}</div>
              } @else if (progression()?.nextFreeSkin) {
                <div class="mbb-next-inner">
                  <div class="mbb-preview"
                       [style.background]="progression()!.nextFreeSkin!.bodyColor + '33'"
                       [style.box-shadow]="'0 0 10px ' + progression()!.nextFreeSkin!.bodyColor + '55'">
                    <img class="mbb-skin-img"
                         [src]="'/assets/tanks/skins/tank-' + skinSlug(progression()!.nextFreeSkin!.name) + '-body.png'"
                         [alt]="progression()!.nextFreeSkin!.name"
                         (error)="onImgError($event, progression()!.nextFreeSkin!.bodyColor)">
                  </div>
                  <div class="mbb-next-info">
                    <span class="mbb-name">{{ skinName(progression()!.nextFreeSkin!.name) }}</span>
                    <div class="mbb-progress-track">
                      <div class="mbb-progress-fill"
                           [style.width]="progression()!.nextFreeSkin!.progressPercent + '%'"
                           [style.background]="rarityColor(progression()!.nextFreeSkin!.rarity)">
                      </div>
                    </div>
                    <span class="mbb-pct">{{ progression()!.nextFreeSkin!.progressPercent }}%</span>
                  </div>
                </div>
              } @else if (progression()) {
                <span class="mbb-name" style="font-size:10px;">{{ 'lobby.mobile_all_unlocked' | translate }}</span>
              }
            </div>

            <div class="mbb-panel mbb-arena">
              <div class="mbb-label">{{ 'lobby.mobile_label_arena' | translate }}</div>
              <div class="mbb-arena-thumb"
                   [style.background-image]="activeArenaThumb()"
                   [style.background-size]="'cover'"
                   [style.background-position]="'center'">
              </div>
              <span class="mbb-name">{{ activeArenaName() }}</span>
              <button class="mbb-btn" (click)="requestShopArenas()">{{ 'lobby.mobile_change' | translate }}</button>
            </div>
          </div>
        </div><!-- /lobby-center -->
        <!-- Ad derecho: pegado al borde exterior de pantalla -->
        <div class="lobby-ad-col lobby-ad-col--right"><app-side-ad /></div>
      </div><!-- /main-row -->

      <!-- Mobile: menú desplegable -->
      @if (mobileMenuOpen()) {
        <div class="mobile-menu-backdrop" (click)="mobileMenuOpen.set(false)">
          <nav class="mobile-menu" (click)="$event.stopPropagation()">
            <div class="mm-header">
              <div class="mm-avatar-ring" (click)="openAvatarPicker(); mobileMenuOpen.set(false)">
                <img [src]="avatarUrl()" (error)="onAvatarImgErr($event)" alt="avatar" class="mm-avatar-img">
              </div>
              <div class="mm-user-info">
                <span class="mm-username">{{ username() || ('lobby.anonymous' | translate) }}</span>
                @if (isLoggedIn()) {
                  <span class="mm-coins">🪙 {{ coins() }}</span>
                } @else {
                  <span class="mm-guest">{{ 'lobby.menu_guest' | translate }}</span>
                }
              </div>
              <div class="mm-header-actions">
                <app-lang-selector variant="header" mode="modal" />
                <button class="mm-close" (click)="mobileMenuOpen.set(false)">✕</button>
              </div>
            </div>
            <div class="mm-sep"></div>
            <button class="mm-item" (click)="requestStats(); mobileMenuOpen.set(false)">
              <span class="mm-icon">📊</span><span class="mm-label">{{ 'lobby.menu_stats' | translate }}</span>
            </button>
            <button class="mm-item" (click)="requestShopNav(); mobileMenuOpen.set(false)">
              <span class="mm-icon">🛒</span><span class="mm-label">{{ 'lobby.menu_shop' | translate }}</span>
            </button>
            <button class="mm-item" (click)="openRankings(); mobileMenuOpen.set(false)">
              <span class="mm-icon">🏆</span><span class="mm-label">{{ 'lobby.menu_rankings' | translate }}</span>
            </button>
            <button class="mm-item" (click)="openAvatarPicker(); mobileMenuOpen.set(false)">
              <span class="mm-icon">👤</span><span class="mm-label">{{ 'lobby.menu_avatar' | translate }}</span>
            </button>
            <div class="mm-sep"></div>
            @if (isLoggedIn()) {
              <button class="mm-item mm-item-logout" (click)="logout()">
                <span class="mm-icon">🚪</span><span class="mm-label">{{ 'lobby.menu_logout' | translate }}</span>
              </button>
            } @else {
              <button class="mm-item" (click)="goLogin(); mobileMenuOpen.set(false)">
                <span class="mm-icon">🔑</span><span class="mm-label">{{ 'lobby.menu_login' | translate }}</span>
              </button>
            }
          </nav>
        </div>
      }
    </div>

    @if (state() === 'found' && pendingRoom()) {
      <app-pre-entry-overlay
        [roomId]="pendingRoom()!.roomId"
        (onEnter)="enterGame($event)"
        (onCancel)="cancelSearch()"
      />
    }

    <!-- Register prompt modal -->
    @if (registerPromptFeature()) {
      <app-register-prompt
        [featureName]="registerPromptFeature()!"
        (accept)="goRegister()"
        (cancel)="registerPromptFeature.set(null)"
      />
    }

    <!-- Tutorial modal (primera vez) -->
    @if (showTutorial()) {
      <app-tutorial-modal (closed)="closeTutorial()" />
    }

    <!-- Rankings modal -->
    @if (showRankings()) {
      <app-rankings-modal (close)="showRankings.set(false)" />
    }

    <!-- Avatar picker modal -->
    @if (showAvatarPicker()) {
      <app-avatar-picker
        [ownedOnly]="false"
        (close)="showAvatarPicker.set(false)"
        (equipped)="onAvatarEquipped($event)"
        (goToShop)="goToShopAvatars()"
      />
    }

    <!-- Levels modal -->
    @if (showLevels()) {
      <div class="lvl-backdrop" (click)="showLevels.set(false)">
        <div class="lvl-modal" (click)="$event.stopPropagation()">
          <div class="lvl-modal-hdr">
            <span class="lvl-modal-title">{{ 'lobby.levels_title' | translate }}</span>
            <span class="lvl-modal-sub">{{ 'lobby.levels_desc' | translate }}</span>
            <button class="lvl-close-btn" (click)="showLevels.set(false)">✕</button>
          </div>
          <div class="lvl-grid">
            @for (lvl of levels; track lvl.n) {
              <div class="lvl-card"
                   [class.lvl-card-yellow]="lvl.yellow && !lvl.radio"
                   [class.lvl-card-toxic]="lvl.toxic"
                   [class.lvl-card-radio]="lvl.radio">
                <div class="lvl-num" [style.color]="lvl.color">{{ 'lobby.level_prefix' | translate }} {{ lvl.n }}</div>
                <!-- Mini tank preview -->
                <div class="lvl-tank-wrap">
                  @if (lvl.yellow && !lvl.radio) {
                    <div class="lvl-tank-aura-ring lvl-aura-yellow"></div>
                  }
                  @if (lvl.radio) {
                    <div class="lvl-tank-aura-ring lvl-aura-green"></div>
                  }
                  <div class="lvl-tank-body"
                       [style.background]="lvl.color"
                       [class.lvl-tank-glow-toxic]="lvl.toxic && !lvl.radio"
                       [class.lvl-tank-glow-radio]="lvl.radio">
                    <div class="lvl-tank-cannon" [style.background]="darken(lvl.color)"></div>
                  </div>
                </div>
                <div class="lvl-tag" [style.background]="lvl.color + '33'" [style.color]="lvl.color">
                  {{ lvl.tag }}
                </div>
                <div class="lvl-perk">{{ lvl.perk }}</div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .lobby {
      min-height: 100vh;
      background:
        radial-gradient(ellipse 70% 55% at 85% 95%, rgba(245,158,11,.05) 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 15% 5%,  rgba(14,165,233,.02)  0%, transparent 45%),
        var(--t-bg);
      color: var(--t-tx);
      font-family: 'Inter', system-ui, sans-serif;
      display: flex; flex-direction: column;

      /* ── Warm amber override: mueve el acento de sky-blue a gold ── */
      --t-accent:       #f59e0b;
      --t-accent-dk:    #d97706;
      --t-on-accent:    #060912;
      --t-accent-bg:    rgba(245,158,11,.05);
      --t-accent-bd:    rgba(245,158,11,.22);
      --t-accent-bd2:   rgba(245,158,11,.30);
      --t-accent-glow:  rgba(245,158,11,.40);
      --t-accent-glow2: rgba(245,158,11,.75);
      --t-focus-bd:     rgba(245,158,11,.55);
      --t-focus-bg:     rgba(245,158,11,.05);
      --t-accent-line:  rgba(245,158,11,.12);
      --t-panel-bd:     rgba(245,158,11,.10);
      --t-hover:        rgba(245,158,11,.05);
      --t-surface:      rgba(245,158,11,.03);
    }

    /* ── Header ─────────────────────────────────────────────────── */
    .header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 28px;
      border-bottom: 1px solid var(--t-accent-line);
      background: var(--t-hdr-bg);
      backdrop-filter: blur(10px);
      position: sticky; top: 0; z-index: 10;
    }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { font-size: 20px; }
    .logo-text {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 17px; font-weight: 900;
      letter-spacing: 4px; color: var(--t-flag);
      text-transform: uppercase;
    }
    .user-bar { display: flex; align-items: center; gap: 12px; }
    .user-chip {
      color: var(--t-sub); font-size: 13px;
      background: var(--t-surface);
      border: 1px solid var(--t-bd);
      border-radius: 20px; padding: 4px 12px;
    }
    .coins-chip {
      color: #f9a825;
      font-size: 13px;
      font-weight: 700;
      background: rgba(249,168,37,0.08);
      border: 1px solid rgba(249,168,37,0.25);
      border-radius: 20px;
      padding: 4px 12px;
    }
    .nav-btn {
      background: transparent;
      border: 1px solid var(--t-accent-bd2);
      color: var(--t-accent);
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
    }
    .nav-btn:hover { background: var(--t-accent-bg); }
    .logout-btn {
      border-color: rgba(255,100,100,0.3);
      color: var(--t-err);
    }
    .logout-btn:hover { background: rgba(255,100,100,0.08); }

    /* ── Ad strip ───────────────────────────────────────────────── */
    .ad-strip { padding: 10px 28px 0; }
    /* Ocultar el banner cuando los side ads están activos (>= 1420px) */
    @media (min-width: 1420px) {
      .ad-strip { display: none; }
    }

    /* ── Daily reward ───────────────────────────────────────────── */
    .daily-strip { padding: 8px 28px 0; }

    /* ── Main row ───────────────────────────────────────────────── */
    .main-row {
      display: flex;
      align-items: flex-start;
      width: 100%;
    }

    /* Columnas laterales de ads: ancho fijo = ancho del ad, no comprimen el centro */
    .lobby-ad-col {
      display: none;
      flex: 0 0 160px;   /* fijo en 160px, sin grow ni shrink */
      align-items: flex-start;
      padding-top: 24px;
      overflow: hidden;  /* evita que desborde si el viewport es justo */
    }
    .lobby-ad-col--left  { justify-content: flex-start; }
    .lobby-ad-col--right { justify-content: flex-end;   }

    @media (min-width: 1420px) {
      .lobby-ad-col { display: flex; }
      .ad-strip { display: none; }
    }
    /* En viewports muy anchos el ad escala a 300px */
    @media (min-width: 1700px) {
      .lobby-ad-col { flex-basis: 300px; }
    }

    /* Columna central: contiene main grid + skins section */
    .lobby-center {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    /* ── Main ───────────────────────────────────────────────────── */
    .main {
      display: grid;
      grid-template-columns: 220px 1fr 220px;
      gap: 20px;
      padding: 24px 28px;
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    }

    /* ── Panels ─────────────────────────────────────────────────── */
    .panel {
      background: var(--t-panel);
      border: 1px solid var(--t-panel-bd);
      border-top: 2px solid rgba(245,158,11,.28);
      border-radius: 12px;
      padding: 20px;
      display: flex; flex-direction: column; gap: 12px;
      box-shadow: var(--t-shadow);
    }
    .panel-header {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 3px;
      color: var(--t-accent);
      text-transform: uppercase;
      opacity: .90;
    }
    .divider { height: 1px; background: var(--t-panel-bd); }

    /* ── Player panel ───────────────────────────────────────────── */
    .avatar-ring {
      width: 60px; height: 60px;
      border-radius: 50%;
      border: 2px solid var(--t-accent-bd);
      display: flex; align-items: center; justify-content: center;
      background: var(--t-accent-bg);
      align-self: center;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .avatar-ring:hover {
      border-color: var(--t-accent);
      box-shadow: 0 0 12px var(--t-accent-glow);
    }
    .avatar-ring:hover .avatar-edit-hint { opacity: 1; }
    .avatar-img {
      width: 100%; height: 100%;
      object-fit: cover;
      border-radius: 50%;
      display: block;
    }
    .avatar-edit-hint {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: #fff;
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .alias-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .alias-input {
      background: var(--t-surface);
      border: 1px solid var(--t-accent-bd2);
      border-radius: 6px;
      color: var(--t-tx);
      font-size: 15px;
      font-weight: 700;
      padding: 6px 10px;
      text-align: center;
      width: 100%;
      box-sizing: border-box;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s;
    }
    .alias-input:focus { border-color: var(--t-accent); }
    .alias-hint { font-size: 10px; color: var(--t-dim); letter-spacing: 0.5px; }
    .player-name { text-align: center; font-weight: 700; font-size: 16px; margin: 0; }
    .status-dot {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; color: var(--t-sub);
      align-self: center;
    }
    .dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #22d3ee;
      box-shadow: 0 0 6px rgba(34,211,238,.70);
    }
    .stat-row {
      display: flex; justify-content: space-between;
      font-size: 13px; color: var(--t-muted);
    }
    .stat-val { color: var(--t-tx); font-weight: 600; }

    /* ── Center / Play ──────────────────────────────────────────── */
    .arena-preview {
      position: relative;
      height: 100%;
      min-height: 320px;
      border: 1px solid var(--t-accent-bd);
      border-radius: 16px;
      overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      background: url('/assets/environment/arena-lobby-bg.png') center/cover no-repeat #060912;
    }
    .grid-anim {
      position: absolute; inset: 0;
      background: linear-gradient(
        to top,
        transparent 0%,
        rgba(6,9,18,.20) 55%,
        rgba(6,9,18,.60) 100%
      );
    }
    .play-content {
      position: relative;
      display: flex; flex-direction: column; align-items: center; gap: 16px;
    }
    .arena-label {
      font-size: 11px; letter-spacing: 3px; color: var(--t-dim);
      text-transform: uppercase; margin: 0;
    }
    .play-btn {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 24px 48px;
      background: linear-gradient(135deg, var(--t-accent-dk, #d97706), var(--t-accent, #f59e0b));
      border: none; border-radius: 4px;
      color: #060912;
      font-weight: 900;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      font-family: 'Barlow Condensed', sans-serif;
      letter-spacing: 3px;
      box-shadow: 0 0 32px var(--t-accent-glow), 0 2px 16px rgba(0,0,0,.50);
    }
    .play-btn:not(:disabled):hover {
      transform: scale(1.04);
      box-shadow: 0 0 50px var(--t-accent-glow2);
    }
    .play-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .play-btn.searching { animation: spin-pulse 1.2s ease-in-out infinite; }
    @keyframes spin-pulse {
      0%,100% { box-shadow: 0 0 30px var(--t-accent-glow); }
      50%      { box-shadow: 0 0 60px var(--t-accent-glow2); }
    }
    .play-icon { font-size: 28px; }
    .play-label { font-size: 18px; letter-spacing: 3px; }
    .play-hint { font-size: 12px; color: var(--t-dim); margin: 0; }
    .join-code-row {
      display: flex; align-items: center; gap: 6px; justify-content: center;
      margin-top: 2px;
    }
    .join-code-toggle {
      background: transparent;
      border: 1px solid var(--t-bd2);
      color: var(--t-tx4);
      border-radius: 6px;
      padding: 5px 12px;
      font-size: 11px;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s, color 0.15s;
    }
    .join-code-toggle:hover { background: var(--t-hover); color: var(--t-tx2); }
    .join-code-input {
      background: var(--t-surface);
      border: 1px solid var(--t-accent-bd2);
      border-radius: 6px;
      color: var(--t-tx);
      font-family: monospace;
      font-size: 12px;
      padding: 5px 10px;
      width: 140px;
      outline: none;
    }
    .join-code-btn {
      background: var(--t-accent);
      border: none;
      color: var(--t-on-accent);
      border-radius: 6px;
      padding: 5px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.15s;
    }
    .join-code-btn:hover { opacity: 0.85; }

    /* ── Info panel ─────────────────────────────────────────────── */
    .mode-card {
      background: var(--t-accent-bg);
      border: 1px solid var(--t-accent-bd);
      border-radius: 8px;
      padding: 12px 14px;
    }
    .mode-name { font-weight: 700; font-size: 14px; margin: 0 0 4px; }
    .mode-desc { font-size: 12px; color: var(--t-muted); margin: 0; line-height: 1.5; }
    .control-row {
      display: flex; align-items: center; gap: 10px;
      font-size: 12px; color: var(--t-muted);
    }
    kbd {
      background: var(--t-ghost-bg);
      border: 1px solid var(--t-ghost-bd);
      border-radius: 4px;
      padding: 2px 7px;
      font-size: 11px; color: var(--t-tx2);
      font-family: monospace;
      white-space: nowrap;
    }

    /* ── Skins section ──────────────────────────────────────────── */
    .skins-section {
      border-top: 1px solid var(--t-panel-bd);
      padding: 20px 0 28px;
      background: var(--t-strip-bg);
    }
    .skins-inner {
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      padding: 0 28px;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: 220px 1fr 220px;
      gap: 20px;
    }

    /* Active skin card */
    .skin-active-card {
      background: var(--t-panel);
      border: 1px solid var(--t-panel-bd);
      border-top: 2px solid rgba(245,158,11,.28);
      border-radius: 12px;
      padding: 18px;
      display: flex; flex-direction: column; gap: 14px;
      box-shadow: var(--t-shadow);
    }
    .skin-label {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 3px;
      color: var(--t-accent);
      text-transform: uppercase;
      opacity: .90;
    }
    .skin-preview-wrap {
      display: flex; align-items: center; gap: 14px;
    }
    .tank-preview {
      width: 54px; height: 54px;
      border-radius: 10px;
      position: relative;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: box-shadow 0.2s;
      overflow: hidden;
    }
    .skin-preview-img {
      width: 100%; height: 100%;
      object-fit: contain;
      display: block;
    }
    .skin-cannon-overlay {
      position: absolute;
      width: 90%; height: 90%;
      top: 50%; left: 50%;
      transform: translate(-50%, -75%);
      object-fit: contain;
      pointer-events: none;
    }
    .skin-info {
      display: flex; flex-direction: column; gap: 3px;
    }
    .skin-name {
      font-size: 14px; font-weight: 700; color: var(--t-tx);
    }
    .skin-rarity {
      font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
    }
    .skin-bonus {
      font-size: 11px; color: var(--t-accent); margin-top: 2px;
      font-weight: 500;
    }
    .skin-change-btn {
      background: transparent;
      border: 1px solid var(--t-accent-bd2);
      color: var(--t-accent);
      border-radius: 7px;
      padding: 7px 0;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
      width: 100%;
      transition: background 0.15s;
    }
    .skin-change-btn:hover { background: var(--t-accent-bg); }

    /* Progress card */
    .skin-progress-card {
      background: var(--t-panel);
      border: 1px solid var(--t-panel-bd);
      border-top: 2px solid rgba(245,158,11,.28);
      border-radius: 12px;
      padding: 18px;
      display: flex; flex-direction: column; gap: 14px;
      box-shadow: var(--t-shadow);
    }
    .progress-loading { font-size: 13px; color: var(--t-dim); }
    .all-unlocked { font-size: 13px; color: var(--t-accent); margin: 0; }

    .next-skin-row {
      display: flex; align-items: center; gap: 14px;
    }
    .tank-preview-sm {
      width: 44px; height: 44px;
      border-radius: 8px;
      position: relative;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .next-skin-info {
      display: flex; flex-direction: column; gap: 2px; flex: 1;
    }
    .next-skin-name { font-size: 13px; font-weight: 700; color: var(--t-tx); }
    .next-skin-rarity { font-size: 11px; font-weight: 600; }
    .next-skin-counter {
      display: flex; align-items: baseline; gap: 3px;
      flex-shrink: 0;
    }
    .counter-val { font-size: 20px; font-weight: 800; color: var(--t-tx); }
    .counter-sep { font-size: 14px; color: var(--t-dim); }
    .counter-total { font-size: 14px; color: var(--t-muted); }
    .counter-label { font-size: 11px; color: var(--t-dim); margin-left: 2px; }

    .progress-bar-wrap {
      display: flex; align-items: center; gap: 10px;
    }
    .progress-bar-track {
      flex: 1;
      height: 8px;
      background: var(--t-surface2);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
      min-width: 2px;
    }
    .progress-pct {
      font-size: 12px;
      font-weight: 700;
      color: var(--t-tx);
      min-width: 36px;
      text-align: right;
    }

    /* Claimable skins */
    .claimable-section {
      display: flex; flex-direction: column; gap: 8px;
    }
    .claimable-label {
      font-size: 12px; color: var(--t-daily-bonus, #f9a825); font-weight: 600;
    }
    .claimable-row {
      display: flex; flex-wrap: wrap; gap: 10px;
    }
    .claimable-item {
      display: flex; align-items: center; gap: 8px;
      border: 1px solid;
      border-radius: 8px;
      padding: 8px 10px;
      flex-wrap: nowrap;
    }
    .tank-preview-xs {
      width: 30px; height: 30px;
      border-radius: 6px;
      position: relative;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .claimable-name {
      font-size: 12px; color: var(--t-tx); font-weight: 600; flex: 1;
    }
    .claim-btn {
      background: linear-gradient(135deg, var(--t-daily-bonus, #f9a825), #e65100);
      border: none;
      border-radius: 5px;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 10px;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      transition: opacity 0.15s;
    }
    .claim-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Guest promo ────────────────────────────────────────────── */
    .guest-promo {
      padding: 10px 28px 0;
    }
    .guest-promo-inner {
      max-width: 1100px;
      margin: 0 auto;
      background: var(--t-accent-bg);
      border: 1px solid var(--t-accent-bd);
      border-radius: 10px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .promo-benefits {
      display: flex; gap: 16px; flex-wrap: wrap; flex: 1;
    }
    .promo-benefit {
      font-size: 12px; color: var(--t-tx4);
      display: flex; align-items: center; gap: 4px;
    }
    .promo-actions {
      display: flex; gap: 10px; flex-shrink: 0;
    }
    .promo-btn {
      border-radius: 7px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      border: none;
      transition: opacity 0.15s, transform 0.1s;
    }
    .promo-btn:hover { opacity: 0.85; transform: translateY(-1px); }
    .promo-btn-register {
      background: linear-gradient(135deg, var(--t-accent-dk, #d97706), var(--t-accent, #f59e0b));
      color: #060912;
    }
    .promo-btn-login {
      background: transparent;
      border: 1px solid var(--t-accent-bd2);
      color: var(--t-accent);
    }

    /* ── Levels button ──────────────────────────────────────────── */
    .levels-btn {
      background: linear-gradient(135deg, var(--t-accent-dk, #d97706), var(--t-accent, #f59e0b));
      border: none;
      color: #060912;
      border-radius: 4px;
      padding: 8px 0;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2px;
      cursor: pointer;
      width: 100%;
      transition: opacity 0.15s, box-shadow 0.15s;
    }
    .levels-btn:hover {
      opacity: 0.9;
      box-shadow: 0 0 14px var(--t-accent-glow);
    }

    /* ── Levels modal ───────────────────────────────────────────── */
    .lvl-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.82);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    }
    .lvl-modal {
      background: var(--t-panel);
      border: 1px solid var(--t-accent-bd);
      border-radius: 16px;
      padding: 24px;
      max-width: 960px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 0 40px var(--t-accent-glow);
    }
    .lvl-modal-hdr {
      display: flex; align-items: baseline; gap: 14px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .lvl-modal-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 18px; font-weight: 900; letter-spacing: 3px; color: var(--t-accent);
    }
    .lvl-modal-sub {
      font-size: 11px; color: var(--t-sub); flex: 1;
    }
    .lvl-close-btn {
      background: transparent; border: 1px solid var(--t-bd);
      color: var(--t-tx); border-radius: 6px; padding: 4px 10px;
      cursor: pointer; font-family: inherit; font-size: 13px;
      margin-left: auto;
      transition: background 0.1s;
    }
    .lvl-close-btn:hover { background: var(--t-surface); }

    .lvl-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
      gap: 10px;
    }
    .lvl-card {
      background: var(--t-surface);
      border: 1px solid var(--t-panel-bd);
      border-radius: 10px;
      padding: 12px 10px;
      display: flex; flex-direction: column; align-items: center; gap: 7px;
      text-align: center;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .lvl-card:hover { border-color: var(--t-accent); }
    .lvl-card.lvl-card-yellow {
      border-color: #FFD70044;
      background: #FFD70008;
    }
    .lvl-card.lvl-card-toxic {
      border-color: #00e67644;
      background: #00e67610;
    }
    .lvl-card.lvl-card-radio {
      border-color: #00ff4166;
      background: #00ff4110;
      box-shadow: 0 0 14px #00ff4122;
    }

    .lvl-num {
      font-size: 11px; font-weight: 800; letter-spacing: 1px;
    }

    /* Mini tank */
    .lvl-tank-wrap {
      position: relative;
      width: 52px; height: 52px;
      display: flex; align-items: center; justify-content: center;
    }
    .lvl-tank-aura-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid transparent;
    }
    .lvl-aura-yellow {
      border-color: #FFD700;
      opacity: 0.7;
      animation: auraYellow 1s ease-in-out infinite alternate;
    }
    @keyframes auraYellow {
      from { transform: scale(0.88); opacity: 0.35; box-shadow: 0 0 4px #FFD70066; }
      to   { transform: scale(1.08); opacity: 0.85; box-shadow: 0 0 10px #FFD700aa; }
    }
    .lvl-aura-green {
      border-color: #00ff41;
      border-width: 2.5px;
      opacity: 0.8;
      animation: auraGreen 0.75s ease-in-out infinite alternate;
    }
    @keyframes auraGreen {
      from { transform: scale(0.86); opacity: 0.4; box-shadow: 0 0 6px #00ff4166; }
      to   { transform: scale(1.1);  opacity: 1.0; box-shadow: 0 0 14px #00ff41bb; }
    }
    .lvl-tank-body {
      width: 34px; height: 34px;
      border-radius: 8px;
      position: relative;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid rgba(0,0,0,0.3);
      z-index: 1;
    }
    .lvl-tank-body.lvl-tank-glow-toxic {
      box-shadow: 0 0 8px #39ff1466, 0 0 16px #39ff1422;
      animation: glowToxic 1s ease-in-out infinite alternate;
    }
    @keyframes glowToxic {
      from { box-shadow: 0 0 5px #39ff1455; }
      to   { box-shadow: 0 0 14px #39ff14aa, 0 0 24px #39ff1433; }
    }
    .lvl-tank-body.lvl-tank-glow-radio {
      box-shadow: 0 0 10px #00ff41aa, 0 0 22px #00ff4144;
      animation: glowRadio 0.75s ease-in-out infinite alternate;
    }
    @keyframes glowRadio {
      from { box-shadow: 0 0 6px #00ff4166; }
      to   { box-shadow: 0 0 18px #00ff41cc, 0 0 32px #00ff4155; }
    }
    .lvl-tank-cannon {
      position: absolute;
      top: -11px; left: 50%; transform: translateX(-50%);
      width: 8px; height: 14px;
      border-radius: 3px;
      border: 1px solid rgba(0,0,0,0.25);
    }

    .lvl-tag {
      font-size: 9px; font-weight: 800;
      letter-spacing: 1px;
      padding: 2px 8px;
      border-radius: 20px;
      text-transform: uppercase;
    }
    .lvl-perk {
      font-size: 11px;
      color: var(--t-tx);
      line-height: 1.5;
      opacity: 0.88;
    }

    /* ── Arena lobby thumb ──────────────────────────────────────── */
    .arena-lobby-thumb {
      width: 60px; height: 60px; border-radius: 10px; flex-shrink: 0;
      border: 1px solid var(--t-panel-bd);
      background-color: #1e1e22;
      background-size: cover; background-position: center;
    }

    /* ── Acentos de color por panel (misma paleta que las 4 cards del landing) ── */
    /* sky-blue → panel jugador / cyan → skin card / amber → play + progress / crimson → info + arena */
    .player-panel {
      border-top-color: rgba(14,165,233,.65);
    }
    .player-panel .panel-header {
      color: #0ea5e9;
    }

    .info-panel {
      border-top-color: rgba(225,29,72,.65);
    }
    .info-panel .panel-header {
      color: #e11d48;
    }

    /* Skin del tank → cyan */
    .skins-inner .skin-active-card:first-child {
      border-top-color: rgba(34,211,238,.65);
    }
    .skins-inner .skin-active-card:first-child .skin-label {
      color: #22d3ee;
    }

    /* Skin de arena → crimson */
    .skins-inner .skin-active-card:last-child {
      border-top-color: rgba(225,29,72,.65);
    }
    .skins-inner .skin-active-card:last-child .skin-label {
      color: #e11d48;
    }

    /* ── Mobile bottom bar (oculta en desktop) ──────────────────────── */
    .mobile-bottom-bar { display: none; }

    .mbb-panel {
      background: var(--t-panel);
      border: 1px solid var(--t-panel-bd);
      border-radius: 10px;
      padding: 10px 8px;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      box-shadow: var(--t-shadow);
    }
    .mbb-label {
      font-size: 8px; font-weight: 700; letter-spacing: 1.5px;
      color: var(--t-accent); text-transform: uppercase; text-align: center;
    }
    .mbb-preview {
      width: 52px; height: 52px; border-radius: 8px;
      position: relative; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .mbb-arena-thumb {
      width: 52px; height: 52px; border-radius: 8px;
      background-color: #1e1e22;
      border: 1px solid var(--t-panel-bd);
      flex-shrink: 0;
    }
    .mbb-skin-img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .mbb-name {
      font-size: 9px; color: var(--t-tx); font-weight: 600;
      text-align: center; line-height: 1.3; word-break: break-word;
    }
    .mbb-btn {
      background: transparent; border: 1px solid var(--t-accent-bd2);
      color: var(--t-accent); border-radius: 5px; padding: 5px 0;
      font-size: 9px; cursor: pointer; font-family: inherit; width: 100%;
      transition: background 0.15s;
    }
    .mbb-btn:hover { background: var(--t-accent-bg); }
    .mbb-loading { font-size: 10px; color: var(--t-dim); }
    .mbb-progress-track {
      width: 100%; height: 6px;
      background: var(--t-surface2); border-radius: 3px; overflow: hidden;
    }
    .mbb-progress-fill {
      height: 100%; border-radius: 3px; transition: width 0.4s ease; min-width: 2px;
    }
    .mbb-pct { font-size: 10px; font-weight: 700; color: var(--t-tx); }

    /* Panel próxima skin: layout horizontal cuando ocupa ancho completo */
    .mbb-next { align-items: stretch; }
    .mbb-next-inner {
      display: flex; align-items: center; gap: 12px; width: 100%;
    }
    .mbb-next-info {
      flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0;
    }
    .mbb-next-info .mbb-name { font-size: 11px; text-align: left; }
    .mbb-next-info .mbb-pct { font-size: 11px; text-align: right; }

    /* ── Mobile side panels (ocultos en desktop) ───────────────────── */
    .mobile-skin-side, .mobile-arena-side { display: none; }

    .side-label {
      font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
      color: var(--t-accent); text-transform: uppercase;
    }
    .side-preview {
      width: 52px; height: 52px; border-radius: 8px;
      position: relative; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .side-arena-preview {
      background-color: #1e1e22;
      background-size: cover; background-position: center;
      border: 1px solid var(--t-panel-bd);
    }
    .side-skin-img {
      width: 100%; height: 100%; object-fit: contain; display: block;
    }
    .side-item-name {
      font-size: 9px; color: var(--t-tx); font-weight: 600;
      text-align: center; line-height: 1.3; word-break: break-word;
    }
    .side-change-btn {
      background: transparent;
      border: 1px solid var(--t-accent-bd2);
      color: var(--t-accent);
      border-radius: 5px; padding: 5px 0;
      font-size: 9px; cursor: pointer;
      font-family: inherit; width: 100%;
      transition: background 0.15s;
    }
    .side-change-btn:hover { background: var(--t-accent-bg); }

    /* ── Hamburger (oculto en desktop) ───────────────────────────── */
    .mobile-hamburger {
      display: none;
      flex-direction: column; align-items: center; justify-content: center;
      gap: 5px;
      background: transparent;
      border: 1px solid var(--t-accent-bd);
      border-radius: 7px;
      padding: 0;
      width: 38px; height: 38px;
      cursor: pointer;
      flex-shrink: 0;
      transition: border-color 0.15s, background 0.15s;
    }
    .mobile-hamburger:hover { background: var(--t-accent-bg); border-color: var(--t-accent); }
    .mobile-hamburger span {
      display: block;
      width: 18px; height: 2px;
      background: var(--t-accent);
      border-radius: 2px;
      transition: transform 0.22s, opacity 0.22s;
      transform-origin: center;
    }
    .mobile-hamburger.is-open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .mobile-hamburger.is-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .mobile-hamburger.is-open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* ── Mobile player row (oculta en desktop) ───────────────────── */
    .mobile-player-row {
      display: none;
      align-items: center; gap: 12px;
      padding: 10px 16px;
      background: var(--t-panel);
      border-bottom: 1px solid var(--t-panel-bd);
    }
    .mobile-avatar {
      position: relative;
      width: 44px; height: 44px; border-radius: 50%;
      border: 2px solid var(--t-accent-bd);
      overflow: hidden; flex-shrink: 0; cursor: pointer;
      transition: border-color 0.15s;
    }
    .mobile-avatar:hover { border-color: var(--t-accent); }
    .mobile-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .mobile-avatar-edit {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; color: #fff;
      border-radius: 50%; opacity: 0; transition: opacity 0.15s;
    }
    .mobile-avatar:hover .mobile-avatar-edit { opacity: 1; }
    .mobile-alias-area { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .mobile-alias-area .alias-input { padding: 5px 8px; font-size: 14px; }
    .mobile-status {
      display: flex; align-items: center; gap: 5px;
      font-size: 10px; color: var(--t-sub); flex-shrink: 0;
    }

    /* ── Mobile touch hint (oculta en desktop) ───────────────────── */
    .mobile-touch-hint {
      display: none;
      flex-wrap: wrap; gap: 6px; justify-content: center;
    }
    .touch-item {
      font-size: 11px; color: var(--t-muted);
      background: var(--t-surface); border: 1px solid var(--t-bd);
      border-radius: 20px; padding: 4px 10px;
    }
    .mobile-levels-btn-sm {
      display: none;
      background: linear-gradient(135deg, var(--t-accent-dk, #d97706), var(--t-accent, #f59e0b));
      border: none; color: #060912;
      border-radius: 4px; padding: 7px 18px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 12px; font-weight: 700; letter-spacing: 2px;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    /* ── Mobile menu overlay ─────────────────────────────────────── */
    .mobile-menu-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.62);
      backdrop-filter: blur(4px);
      z-index: 200;
      display: flex; align-items: flex-start; justify-content: flex-end;
    }
    .mobile-menu {
      background: var(--t-bg2);
      border-left: 1px solid var(--t-bd);
      width: min(300px, 88vw);
      min-height: 100vh;
      overflow-y: auto;
      box-shadow: -4px 0 24px rgba(0,0,0,0.4);
      display: flex; flex-direction: column;
    }
    .mm-header {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--t-bd);
      flex-shrink: 0;
    }
    .mm-avatar-ring {
      width: 38px; height: 38px; border-radius: 50%;
      border: 2px solid var(--t-accent-bd);
      overflow: hidden; flex-shrink: 0; cursor: pointer;
    }
    .mm-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .mm-user-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; overflow: hidden; }
    .mm-username { font-size: 13px; font-weight: 700; color: var(--t-tx); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 110px; }
    .mm-coins { font-size: 11px; color: #f9a825; font-weight: 600; }
    .mm-guest { font-size: 10px; color: var(--t-dim); }
    .mm-header-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .mm-close {
      background: transparent; border: 1px solid var(--t-bd);
      color: var(--t-tx3); border-radius: 6px;
      padding: 5px 9px; cursor: pointer; font-family: inherit; font-size: 13px; flex-shrink: 0;
    }
    .mm-sep { height: 1px; background: var(--t-bd); margin: 4px 0; flex-shrink: 0; }
    .mm-item {
      display: flex; align-items: center; gap: 14px;
      width: 100%; padding: 12px 18px;
      background: transparent; border: none;
      color: var(--t-tx2); font-size: 15px; font-family: inherit;
      cursor: pointer; text-align: left;
      transition: background 0.12s;
    }
    .mm-item:hover { background: var(--t-surface); }
    .mm-item:active { background: var(--t-accent-bg); }
    .mm-icon { font-size: 20px; flex-shrink: 0; width: 26px; text-align: center; }
    .mm-label { flex: 1; font-weight: 500; }
    .mm-item-logout { color: var(--t-err); }
    .mm-item-accent { color: var(--t-accent); font-weight: 700; }

    /* ══════════════════════════════════════════════════════════════
       RESPONSIVE MOBILE — max-width: 768px
       ══════════════════════════════════════════════════════════════ */
    @media (max-width: 768px) {
      /* Header */
      .header { padding: 12px 16px; }
      .user-bar { display: none !important; }
      .mobile-hamburger { display: flex !important; }
      .logo-text { font-size: 11px; letter-spacing: 1.5px; }

      /* Mobile player row visible */
      .mobile-player-row { display: flex !important; }

      /* Strip padding + cap ad height */
      .ad-strip { padding: 8px 16px 0; max-height: 90px; overflow: hidden; }
      .daily-strip { padding: 6px 16px 0; }
      .guest-promo { padding: 8px 16px 0; }
      .guest-promo-inner { flex-direction: column; align-items: flex-start; gap: 12px; }
      .promo-benefits { gap: 8px; }
      .promo-benefit { font-size: 11px; }
      .promo-actions { width: 100%; display: flex; gap: 8px; }
      .promo-btn { flex: 1; text-align: center; padding: 9px 8px; font-size: 12px; }

      /* Main: 3 columnas con skin/arena en los lados del play button */
      .main {
        grid-template-columns: 90px 1fr 90px;
        gap: 8px;
        padding: 10px 10px;
        max-width: 100%;
      }
      /* Mostrar paneles laterales pero ocultar contenido de escritorio */
      .player-panel, .info-panel {
        display: flex !important;
        padding: 10px 8px !important;
        gap: 8px !important;
      }
      .player-panel > *:not(.mobile-skin-side),
      .info-panel > *:not(.mobile-arena-side) { display: none !important; }
      /* Mostrar elementos móvil de skin/arena */
      .mobile-skin-side, .mobile-arena-side {
        display: flex; flex-direction: column; align-items: center;
        gap: 6px; width: 100%; text-align: center;
      }

      /* Arena preview */
      .center { width: 100%; }
      .arena-preview { min-height: 220px; border-radius: 12px; }
      .play-btn { padding: 18px 32px; }
      .play-label { font-size: 15px; letter-spacing: 2px; }
      .play-icon { font-size: 24px; }
      .play-hint { font-size: 11px; }

      /* Mobile touch hints visibles */
      .mobile-touch-hint { display: flex !important; margin-top: 6px; }
      .mobile-levels-btn-sm { display: inline-block !important; margin-top: 4px; }

      /* Skins section: ocultar completamente en mobile portrait (reemplazada por mobile-bottom-bar) */
      .skins-section { display: none !important; }

      /* Mobile bottom bar: solo muestra próxima skin (skin/arena ya están en paneles laterales) */
      .mobile-bottom-bar {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 0;
        padding: 10px 12px 16px;
        background: var(--t-strip-bg);
        border-top: 1px solid var(--t-panel-bd);
      }
      .mbb-skin, .mbb-arena { display: none !important; }

      /* Padding top/bottom para que Buscar Partida y Ver Niveles no queden pegados al borde */
      .arena-preview { padding: 18px 16px; }

      /* Levels modal: full-screen desde abajo */
      .lvl-backdrop { align-items: flex-end; padding: 0; }
      .lvl-modal {
        max-width: 100%; width: 100%;
        max-height: 90vh;
        border-radius: 16px 16px 0 0;
        padding: 16px;
      }
      .lvl-modal-hdr { flex-direction: column; gap: 8px; }
      .lvl-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
      .lvl-card { padding: 10px 8px; }
      .lvl-perk { font-size: 10px; }
    }

    /* Teléfonos muy pequeños */
    @media (max-width: 480px) {
      .header { padding: 10px 14px; }
      .logo-text { display: none; }
      .main { grid-template-columns: 74px 1fr 74px; gap: 6px; padding: 8px; }
      .arena-preview { min-height: 190px; }
      .play-btn { padding: 15px 24px; }
      .play-label { font-size: 14px; }
      .side-preview { width: 42px; height: 42px; }
      .lvl-grid { grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)); }
      .mobile-bottom-bar {
        grid-template-columns: 74px 1fr 74px !important;
        gap: 6px !important;
        padding: 8px 8px 14px !important;
      }
      .mbb-preview, .mbb-arena-thumb { width: 40px !important; height: 40px !important; }
    }

    /* ══════════════════════════════════════════════════════════════
       RESPONSIVE MÓVIL LANDSCAPE
       Se activa cuando la altura es ≤ 500 px y la orientación es horizontal.
       Esto captura exactamente celulares en landscape sin afectar tablets/desktop.
       NO toca los estilos de portrait (max-width: 768px) ni de desktop.
       ══════════════════════════════════════════════════════════════ */
    @media (max-height: 500px) and (orientation: landscape) {
      /* Header delgado */
      .header { padding: 6px 16px; }
      .logo-text { font-size: 10px; letter-spacing: 1.5px; }
      .user-bar { display: none !important; }
      .mobile-hamburger { display: flex !important; }

      /* Ocultar strips que consumen altura sin valor inmediato en landscape */
      .ad-strip { display: none !important; }
      .daily-strip { display: none !important; }
      .guest-promo { display: none !important; }

      /* Fila de jugador compacta arriba */
      .mobile-player-row {
        display: flex !important;
        padding: 6px 16px;
        border-bottom: 1px solid var(--t-panel-bd);
      }
      .mobile-avatar { width: 34px; height: 34px; }
      .mobile-alias-area .alias-input { padding: 3px 8px; font-size: 13px; }
      .mobile-status { display: none; }

      /* Main: 3 columnas en landscape — skin | play | arena */
      .main {
        grid-template-columns: 80px 1fr 80px !important;
        gap: 6px !important;
        padding: 6px 10px !important;
        max-width: 100% !important;
      }
      /* Mostrar paneles laterales con solo el contenido mobile */
      .player-panel, .info-panel {
        display: flex !important;
        padding: 8px 6px !important;
        gap: 6px !important;
      }
      .player-panel > *:not(.mobile-skin-side),
      .info-panel > *:not(.mobile-arena-side) { display: none !important; }
      .mobile-skin-side, .mobile-arena-side {
        display: flex !important; flex-direction: column; align-items: center;
        gap: 4px; width: 100%; text-align: center;
      }
      .side-preview { width: 38px !important; height: 38px !important; }

      /* Arena preview compacta */
      .center { width: 100%; }
      .arena-preview { min-height: 130px !important; border-radius: 10px; padding: 12px 16px; }
      .play-content { gap: 8px; }
      .arena-label { display: none; }
      .play-btn { padding: 10px 28px !important; }
      .play-label { font-size: 13px !important; letter-spacing: 2px; }
      .play-icon { font-size: 20px !important; }
      .play-hint { display: none; }

      /* Touch hints y botón de niveles */
      .mobile-touch-hint { display: flex !important; margin-top: 4px; }
      .touch-item { font-size: 10px; padding: 3px 8px; }
      .mobile-levels-btn-sm { display: inline-block !important; margin-top: 2px; font-size: 10px; padding: 5px 14px; }

      /* Skins section: ocultar */
      .skins-section { display: none !important; }

      /* Barra inferior landscape: solo progreso próxima skin */
      .mobile-bottom-bar {
        display: grid !important;
        grid-template-columns: 1fr !important;
        padding: 6px 12px 8px !important;
      }
      .mbb-skin, .mbb-arena { display: none !important; }
      .mbb-preview { width: 34px !important; height: 34px !important; }
      .mbb-label { font-size: 7px !important; }
      .mbb-name { font-size: 8px !important; }

      /* Menú lateral: altura limitada */
      .mobile-menu { min-height: auto; max-height: 100vh; }

      /* Modal de niveles: scroll interno con altura limitada */
      .lvl-backdrop { align-items: center; padding: 12px; }
      .lvl-modal {
        max-width: 100%;
        width: 100%;
        max-height: 88vh;
        border-radius: 12px;
        padding: 12px;
      }
      .lvl-modal-hdr { margin-bottom: 10px; }
      .lvl-modal-title { font-size: 14px; }
      .lvl-modal-sub { display: none; }
      .lvl-grid {
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 6px;
      }
      .lvl-card { padding: 8px 6px; gap: 4px; }
      .lvl-num { font-size: 10px; }
      .lvl-tank-wrap { width: 38px; height: 38px; }
      .lvl-tank-body { width: 26px; height: 26px; border-radius: 6px; }
      .lvl-tank-cannon { width: 6px; height: 10px; top: -8px; }
      .lvl-tag { font-size: 8px; padding: 1px 6px; }
      .lvl-perk { font-size: 9px; }

      /* Rankings modal */
      .lvl-backdrop { padding: 10px; }
    }
  `],
})
export class LobbyComponent implements OnInit, OnDestroy {
  private readonly router            = inject(Router);
  private readonly route             = inject(ActivatedRoute);
  private readonly socketService     = inject(GameSocketService);
  private readonly authService       = inject(AuthService);
  private readonly skinsService      = inject(SkinsService);
  private readonly arenaSkinService  = inject(ArenaSkinService);
  private readonly avatarsSvc        = inject(AvatarsService);
  private readonly http              = inject(HttpClient);
  private readonly adsService        = inject(AdsService);
  private readonly translate         = inject(TranslateService);
  readonly fullscreen                = inject(MobileFullscreenService);

  readonly state       = signal<LobbyState>('idle');
  readonly pendingRoom = signal<RoomJoinedEvent | null>(null);
  readonly username    = signal<string>('');
  readonly accountName = signal<string>('');
  readonly isLoggedIn  = signal(false);
  readonly lastScore   = signal('—');
  readonly lastTime    = signal('—');

  readonly activeSkin    = signal<Skin | null>(null);
  readonly progression   = signal<SkinProgression | null>(null);
  readonly skinLoading   = signal(false);
  readonly claiming      = signal(false);
  readonly coins         = signal(0);
  readonly showLevels    = signal(false);

  readonly activeArenaSlug      = signal<string>('default');
  readonly arenaSkinsAvailable  = signal<ArenaSkinItem[]>([]);
  readonly registerPromptFeature = signal<string | null>(null);
  readonly showRankings          = signal(false);
  readonly showAvatarPicker      = signal(false);
  readonly activeAvatarSlug      = signal(this.avatarsSvc.getActiveSlug());

  readonly levels = LEVEL_DATA;
  readonly mobileMenuOpen = signal(false);
  readonly roomCodeInput  = signal('');
  readonly showJoinCode   = signal(false);
  readonly showTutorial   = signal(false);

  private subs: Subscription[] = [];

  ngOnInit(): void {
    const loggedIn = this.authService.isLoggedIn;
    const accountUsername = this.authService.getCurrentUsername() ?? '';
    this.isLoggedIn.set(loggedIn);
    this.accountName.set(accountUsername);

    const savedAlias = localStorage.getItem('ast_alias');
    if (savedAlias) {
      this.username.set(savedAlias);
    } else if (loggedIn && accountUsername) {
      this.username.set(accountUsername);
    } else {
      this.username.set(`Tank-${Math.floor(Math.random() * 9999)}`);
    }

    this.loadLastSession();

    this.activeArenaSlug.set(this.arenaSkinService.getActiveSlug());

    // Mostrar tutorial la primera vez
    if (!localStorage.getItem('df_tutorial_seen')) {
      this.showTutorial.set(true);
    }

    // Auto-join si viene con ?room=CODE en la URL
    const roomParam = this.route.snapshot.queryParamMap.get('room');
    if (roomParam) {
      // Dar un tick para que la UI cargue, luego unirse
      setTimeout(() => this.findGame(roomParam), 100);
    }

    this.subs.push(
      this.arenaSkinService.list().subscribe({
        next: skins => this.arenaSkinsAvailable.set(skins),
        error: () => { /* silent — no auth or server issue */ },
      }),
    );

    if (loggedIn) {
      this.loadSkinData();
      this.loadWallet();
    }
  }

  ngOnDestroy(): void {
    for (const s of this.subs) s.unsubscribe();
  }

  closeTutorial(): void {
    localStorage.setItem('df_tutorial_seen', '1');
    this.showTutorial.set(false);
  }

  findGame(roomId?: string): void {
    if (this.state() !== 'idle') return;
    this.state.set('searching');

    // Always start with a fresh socket to avoid stale room state from previous sessions
    this.socketService.disconnect();
    this.socketService.connect(this.username());

    this.subs.push(
      this.socketService.onRoomJoined$.subscribe(room => {
        this.state.set('found');
        this.pendingRoom.set(room);
      }),
    );

    this.socketService.joinOnConnect(roomId, this.username(), this.authService.getAccessToken());
  }

  joinWithCode(): void {
    const code = this.roomCodeInput().trim();
    if (!code) return;
    this.findGame(code);
  }

  enterGame(bonus: 'ammo' | 'walls' | undefined): void {
    this.adsService.startGameSession();
    void this.router.navigate(['/game'], {
      state: { bonus: bonus ?? null },
    });
  }

  cancelSearch(): void {
    for (const s of this.subs) s.unsubscribe();
    this.subs.length = 0;
    this.socketService.leaveGame();
    this.socketService.disconnect();
    this.state.set('idle');
    this.pendingRoom.set(null);
  }

  onAliasChange(event: Event): void {
    const alias = (event.target as HTMLInputElement).value.trim().slice(0, 20);
    if (alias) {
      this.username.set(alias);
      localStorage.setItem('ast_alias', alias);
    }
  }

  goShop(): void        { void this.router.navigate(['/shop']); }
  goShopArenas(): void  { void this.router.navigate(['/shop'], { queryParams: { section: 'arenas' } }); }
  goToShopAvatars(): void { void this.router.navigate(['/shop'], { queryParams: { section: 'avatars' } }); }
  goStats(): void    { void this.router.navigate(['/stats']); }
  goLogin(): void    { void this.router.navigate(['/auth/login']); }
  goRegister(): void { void this.router.navigate(['/auth/register']); }
  logout(): void     { this.authService.logout(); }
  openRankings(): void { this.showRankings.set(true); }

  openAvatarPicker(): void {
    if (!this.isLoggedIn()) { this.registerPromptFeature.set(this.translate.instant('lobby.menu_avatar')); return; }
    this.showAvatarPicker.set(true);
  }

  onAvatarEquipped(slug: string): void {
    this.activeAvatarSlug.set(slug);
  }

  avatarUrl(): string {
    return this.avatarsSvc.getAvatarUrl(this.activeAvatarSlug());
  }

  onAvatarImgErr(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/avatars/avatar-01.png';
    (event.target as HTMLImageElement).onerror = null;
  }

  requestStats(): void {
    if (!this.isLoggedIn()) { this.registerPromptFeature.set(this.translate.instant('lobby.menu_stats')); return; }
    this.goStats();
  }

  requestShopNav(): void {
    if (!this.isLoggedIn()) { this.registerPromptFeature.set(this.translate.instant('lobby.menu_shop')); return; }
    this.goShop();
  }

  requestShop(): void {
    if (!this.isLoggedIn()) { this.registerPromptFeature.set(this.translate.instant('lobby.skin_change')); return; }
    this.goShop();
  }

  requestShopArenas(): void {
    if (!this.isLoggedIn()) { this.registerPromptFeature.set(this.translate.instant('lobby.arena_change')); return; }
    this.goShopArenas();
  }

  onDailyRewardClaimed(earned: number): void {
    this.coins.update(c => c + earned);
  }

  claimSkin(skinId: string): void {
    if (!this.isLoggedIn()) { this.registerPromptFeature.set(this.translate.instant('lobby.claim_btn')); return; }
    if (this.claiming()) return;
    this.claiming.set(true);
    this.skinsService.claimFree(skinId).subscribe({
      next: () => {
        this.claiming.set(false);
        this.loadSkinData();
      },
      error: () => this.claiming.set(false),
    });
  }

  rarityColor(rarity: string): string {
    return RARITY_COLOR[rarity] ?? '#fff';
  }

  rarityLabel(rarity: string): string {
    return this.skinsService.rarityLabel(rarity);
  }

  bonusSummary(skin: Skin): string {
    return this.skinsService.bonusSummary(skin);
  }

  skinSlug(name: string): string {
    const diacriticRe = new RegExp('[\\u0300-\\u036f]', 'g');
    return name.normalize('NFD').replace(diacriticRe, '').toLowerCase()
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  skinName(name: string): string {
    const key = 'skins.' + this.skinSlug(name);
    const t = this.translate.instant(key);
    return t === key ? name : t;
  }

  arenaName(slug: string, fallbackName: string): string {
    if (slug === 'default') return this.translate.instant('shop.default_arena_name');
    const key = 'arenas.' + slug;
    const t = this.translate.instant(key);
    return t === key ? fallbackName : t;
  }

  onImgError(event: Event, fallbackColor: string): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    if (img.parentElement) img.parentElement.style.background = fallbackColor;
  }

  activeArenaName(): string {
    const slug = this.activeArenaSlug();
    const arena = this.arenaSkinsAvailable().find(s => s.slug === slug);
    return this.arenaName(slug, arena?.name ?? slug);
  }

  activeArenaThumb(): string {
    const slug = this.activeArenaSlug();
    if (slug === 'default') return 'linear-gradient(135deg,#222225,#3a3a3f)';
    return `url('assets/environment/arenas/${slug}.png')`;
  }

  darken(hex: string): string {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (n >> 16) - 40);
    const g = Math.max(0, ((n >> 8) & 0xff) - 40);
    const b = Math.max(0, (n & 0xff) - 40);
    return `rgb(${r},${g},${b})`;
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private loadLastSession(): void {
    const score = localStorage.getItem('ast_last_score');
    const time  = localStorage.getItem('ast_last_time');
    if (score) this.lastScore.set(score);
    if (time)  this.lastTime.set(time);
  }

  private loadWallet(): void {
    this.http.get<{ coins: number }>(`${environment.apiUrl}/economy/wallet`).subscribe({
      next: w => this.coins.set(w.coins),
      error: () => {},
    });
  }

  private loadSkinData(): void {
    this.skinLoading.set(true);

    this.subs.push(
      this.skinsService.getMySkins().subscribe({
        next: skins => {
          const equipped = skins.find(s => s.equipped) ?? null;
          this.activeSkin.set(equipped);
          this.skinLoading.set(false);
        },
        error: () => this.skinLoading.set(false),
      }),
    );

    this.subs.push(
      this.skinsService.getProgression().subscribe({
        next: p => this.progression.set(p),
        error: () => { /* silent fail — no auth or server issue */ },
      }),
    );
  }
}
