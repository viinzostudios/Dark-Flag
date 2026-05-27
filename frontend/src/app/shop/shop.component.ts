import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';
import { SkinsService, Skin, CoinPackage, SkinProgression } from '../core/services/skins.service';
import { ArenaSkinService, ArenaSkinItem } from '../core/services/arena-skin.service';
import { AvatarsService, AvatarItem } from '../core/services/avatars.service';
import { StripeCheckoutComponent } from './stripe-checkout.component';

type Filter = 'all' | 'common' | 'rare' | 'epic' | 'legendary';

function nameToSlug(name: string): string {
  const diacriticRe = new RegExp('[\\u0300-\\u036f]', 'g');
  return name.normalize('NFD').replace(diacriticRe, '').toLowerCase()
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const RARITY_COLOR: Record<string, string> = {
  common:    '#9e9e9e',
  rare:      '#2196f3',
  epic:      '#9c27b0',
  legendary: '#ff9800',
};

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [RouterLink, StripeCheckoutComponent, TranslateModule],
  template: `
    <div class="shop-root">

      <!-- ── Header fijo ─────────────────────────────────────────── -->
      <header class="shop-header">
        <div class="logo">
          <span class="logo-icon">🏳️</span>
          <span class="logo-text">DARK FLAG</span>
        </div>
        <div class="wallet-bar">
          <span class="wallet-coins">💰 {{ coins() }}</span>
          <span class="wallet-gems">💎 {{ gems() }}</span>
        </div>
        <a routerLink="/lobby" class="back-btn">{{ 'shop.back' | translate }}</a>
      </header>

      <!-- ── Barra de progresión ─────────────────────────────────── -->
      @if (progression()) {
        <div class="prog-strip">
          @if (progression()!.nextFreeSkin) {
            <span class="prog-next-label">{{ 'shop.next_free' | translate }}</span>
            <strong class="prog-next-name"
                    [style.color]="rarityColor(progression()!.nextFreeSkin!.rarity)">
              {{ skinName(progression()!.nextFreeSkin!.name) }}
            </strong>
            <div class="prog-track">
              <div class="prog-fill"
                   [style.width]="progression()!.nextFreeSkin!.progressPercent + '%'"
                   [style.background]="rarityColor(progression()!.nextFreeSkin!.rarity)">
              </div>
            </div>
            <span class="prog-pct">{{ progression()!.nextFreeSkin!.progressPercent }}%</span>
          } @else {
            <span class="prog-done">{{ 'shop.all_unlocked' | translate }}</span>
          }
        </div>
      }

      <!-- ── Notificación ────────────────────────────────────────── -->
      @if (notif()) {
        <div class="notif" [class.error]="notifError()">{{ notif() }}</div>
      }

      <!-- ── Secciones principales ─────────────────────────────── -->
      <div class="tabs">
        <button class="tab" [class.active]="section() === 'tanks'"    (click)="setSection('tanks')">Personajes</button>
        <button class="tab" [class.active]="section() === 'avatars'"  (click)="setSection('avatars')">{{ 'shop.tab_avatars' | translate }}</button>
        <button class="tab" [class.active]="section() === 'arenas'"   (click)="setSection('arenas')">{{ 'shop.tab_arenas' | translate }}</button>
        <button class="tab" [class.active]="section() === 'packages'" (click)="setSection('packages')">{{ 'shop.tab_packages' | translate }}</button>
      </div>

      <!-- ── Sub-filtros contextuales ───────────────────────────── -->
      @if (section() === 'tanks') {
        <div class="sub-tabs">
          @for (f of filters; track f) {
            <button class="tab" [class.active]="activeFilter() === f" (click)="setFilter(f)">
              @if (f !== 'all') {
                <span class="tab-dot" [style.background]="rarityColor(f)"></span>
              }
              {{ filterLabel(f) }}
            </button>
          }
        </div>
      } @else if (section() === 'avatars') {
        <div class="sub-tabs">
          @for (cat of avatarCategories; track cat.key) {
            <button class="tab" [class.active]="activeAvatarCat() === cat.key" (click)="setAvatarCat(cat.key)">
              {{ ('avatar_picker.cat_' + cat.key) | translate }}
            </button>
          }
        </div>
      }

      <!-- ── Área scrollable ────────────────────────────────────── -->
      <div class="scroll-area">

        @if (section() === 'arenas') {
          <!-- ── Grid de escenarios ──────────────────────────────── -->
          <div class="arenas-view">
            <h2 class="section-title" style="color:#9c27b0">{{ 'shop.arenas_title' | translate }}</h2>
            <p class="section-sub">{{ 'shop.arenas_sub' | translate }}</p>

            @if (arenaLoading()) {
              <p style="color:var(--t-muted)">{{ 'shop.arenas_loading' | translate }}</p>
            } @else {
              <div class="arena-shop-grid">

                <!-- Default siempre primero -->
                <div class="arena-shop-card" [class.arena-equipped]="activeArenaSlug() === 'default'">
                  <div class="arena-shop-thumb" style="background:linear-gradient(135deg,#222225,#3a3a3f);">
                    @if (activeArenaSlug() === 'default') { <span class="arena-equipped-badge">{{ 'shop.equipped_badge' | translate }}</span> }
                  </div>
                  <div class="arena-shop-info">
                    <div class="arena-shop-name">{{ 'shop.default_arena_name' | translate }}</div>
                    <div class="arena-shop-desc">{{ 'shop.default_arena_desc' | translate }}</div>
                    <div class="arena-shop-actions">
                      <span class="badge owned-b">{{ 'shop.badge_owned' | translate }}</span>
                      @if (activeArenaSlug() !== 'default') {
                        <button class="btn primary" (click)="equipArena('default')" [disabled]="loading()">{{ 'shop.btn_equip' | translate }}</button>
                      }
                    </div>
                  </div>
                </div>

                @for (s of arenaSkinsAvailable(); track s.slug) {
                  <div class="arena-shop-card" [class.arena-equipped]="s.equipped">
                    <div class="arena-shop-thumb">
                      <img [src]="'assets/environment/arenas/' + s.slug + '.png'"
                           [alt]="s.name" class="arena-shop-img">
                      @if (s.equipped) { <span class="arena-equipped-badge">{{ 'shop.equipped_badge' | translate }}</span> }
                      @if (!s.owned)   { <span class="arena-lock-overlay">🔒</span> }
                    </div>
                    <div class="arena-shop-info">
                      <div class="arena-shop-name">{{ arenaName(s.slug, s.name) }}</div>
                      <div class="arena-shop-desc">{{ s.description }}</div>
                      <div class="arena-shop-actions">
                        @if (s.owned) {
                          <span class="badge owned-b">{{ 'shop.badge_owned' | translate }}</span>
                          @if (!s.equipped) {
                            <button class="btn primary" (click)="equipArena(s.slug)" [disabled]="loading()">{{ 'shop.btn_equip' | translate }}</button>
                          }
                        } @else {
                          <button class="btn preview" (click)="previewArena(s.slug)" [disabled]="loading()">
                            {{ activeArenaSlug() === s.slug ? ('shop.btn_preview_active' | translate) : ('shop.btn_preview_idle' | translate) }}
                          </button>
                          <button class="btn gem" (click)="buyArena(s)" [disabled]="loading()">
                            💎 {{ s.priceGems }}
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

        } @else if (section() === 'avatars') {
          <!-- ── Grid de avatares ─────────────────────────────────── -->
          <div class="avatars-view">
            <h2 class="section-title" style="color:var(--t-accent)">{{ 'shop.avatars_title' | translate }}</h2>
            <p class="section-sub">{{ 'shop.avatars_sub' | translate }}</p>

            @if (avatarLoading()) {
              <p style="color:var(--t-muted);padding:40px;text-align:center">{{ 'shop.avatars_loading' | translate }}</p>
            } @else {
              <div class="avatar-shop-grid">
                @for (a of filteredAvatars(); track a.slug) {
                  <div class="avatar-shop-card"
                       [class.av-equipped]="a.slug === activeAvatarSlug()"
                       [class.av-owned]="a.owned">
                    <div class="av-img-wrap">
                      <img class="av-img"
                           [src]="'assets/avatars/' + a.slug + '.png'"
                           [alt]="a.name"
                           (error)="onAvatarImgErr($event)">
                      @if (a.slug === activeAvatarSlug()) {
                        <div class="av-equipped-badge">✓</div>
                      }
                      @if (!a.owned) {
                        <div class="av-lock">🔒</div>
                      }
                    </div>
                    <span class="av-name">{{ avatarName(a.slug, a.name) }}</span>
                    <span class="av-price" [class.free]="a.priceCoins === 0">
                      {{ a.priceCoins === 0 ? ('shop.free' | translate) : (a.priceCoins + ' 🪙') }}
                    </span>
                    <div class="av-actions">
                      @if (a.slug === activeAvatarSlug()) {
                        <span class="badge equipped-b" style="font-size:9px">{{ 'shop.equipped_badge' | translate }}</span>
                      } @else if (a.owned) {
                        <button class="btn primary" style="font-size:10px;padding:5px"
                                (click)="equipAvatar(a)" [disabled]="loading()">{{ 'shop.btn_equip' | translate }}</button>
                      } @else if (a.priceCoins === 0) {
                        <button class="btn primary" style="font-size:10px;padding:5px"
                                (click)="equipAvatar(a)" [disabled]="loading()">{{ 'shop.btn_equip' | translate }}</button>
                      } @else {
                        <button class="btn primary" style="font-size:10px;padding:5px"
                                (click)="buyAvatar(a)" [disabled]="loading()">
                          💰 {{ a.priceCoins }}
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>

        } @else if (section() === 'tanks') {
          <!-- Grid de skins -->
          <div class="grid">
            @for (skin of filteredSkins(); track skin.id) {
              <div class="card"
                   [class.owned]="skin.owned"
                   [class.equipped]="skin.equipped"
                   [style.border-color]="skin.equipped ? rarityColor(skin.rarity) : ''">

                <!-- Preview del tanque: body + cañón lado a lado -->
                <div class="preview"
                     [style.box-shadow]="'0 0 20px ' + skin.bodyColor + '55'">
                  <div class="preview-part">
                    <img class="skin-img"
                         [src]="'/assets/tanks/skins/tank-' + skinSlug(skin.name) + '-body.png'"
                         [alt]="skin.name"
                         (error)="onImgError($event, skin.bodyColor)">
                    <span class="part-lbl">{{ 'shop.part_body' | translate }}</span>
                  </div>
                  <div class="preview-sep"></div>
                  <div class="preview-part">
                    <img class="skin-cannon-img"
                         [src]="'/assets/tanks/skins/tank-' + skinSlug(skin.name) + '-cannon.png'"
                         [alt]="skin.name">
                    <span class="part-lbl">{{ 'shop.part_cannon' | translate }}</span>
                  </div>
                  @if (skin.equipped) {
                    <span class="equipped-flag">⚡</span>
                  }
                </div>

                <div class="rarity" [style.color]="rarityColor(skin.rarity)">
                  {{ rarityLabel(skin.rarity) }}
                </div>
                <div class="skin-name">{{ skinName(skin.name) }}</div>
                <div class="skin-desc">{{ skin.description }}</div>

                <!-- Chips de bonos -->
                @if (bonusSummary(skin)) {
                  <div class="bonuses">
                    @if (skin.speedBonus)       { <span class="bc speed">+{{ skin.speedBonus }}% vel</span> }
                    @if (skin.hpBonus)          { <span class="bc hp">+{{ skin.hpBonus }} HP</span> }
                    @if (skin.ammoBonus)        { <span class="bc ammo">+{{ skin.ammoBonus }} balas</span> }
                    @if (skin.wallBonus)        { <span class="bc wall">+{{ skin.wallBonus }} muros</span> }
                    @if (skin.bulletSpeedBonus) { <span class="bc bullet">+{{ skin.bulletSpeedBonus }}% proj</span> }
                    @if (skin.xpMultiplier)     { <span class="bc xp">+{{ skin.xpMultiplier }}% XP</span> }
                    @if (skin.coinMultiplier)   { <span class="bc coin">+{{ skin.coinMultiplier }}% coins</span> }
                  </div>
                }

                <!-- Barra de desbloqueo (solo si no es tuya) -->
                @if (!skin.owned && skin.matchesUnlock > 0 && progression()) {
                  <div class="unlock-wrap">
                    <div class="unlock-track">
                      <div class="unlock-fill"
                           [style.width]="unlockPct(skin) + '%'"
                           [style.background]="rarityColor(skin.rarity)">
                      </div>
                    </div>
                    <span class="unlock-txt">
                      {{ 'shop.unlock_progress' | translate : { current: progression()!.gamesPlayed, total: skin.matchesUnlock } }}
                    </span>
                  </div>
                }

                <!-- Botones de acción -->
                <div class="card-actions">
                  @if (skin.owned) {
                    @if (skin.equipped) {
                      <span class="badge equipped-b">{{ 'shop.equipped_badge_skin' | translate }}</span>
                      <button class="btn outline" (click)="unequip()" [disabled]="loading()">{{ 'shop.btn_unequip' | translate }}</button>
                    } @else {
                      <span class="badge owned-b">{{ 'shop.badge_owned_skin' | translate }}</span>
                      <button class="btn primary" (click)="equip(skin)" [disabled]="loading()">{{ 'shop.btn_equip' | translate }}</button>
                    }
                  } @else if (skin.claimable) {
                    <button class="btn claim" (click)="claimFree(skin)" [disabled]="loading()">
                      {{ 'shop.btn_claim_free' | translate }}
                    </button>
                  } @else {
                    <div class="price-row">
                      @if (skin.price > 0) {
                        <button class="btn coin-buy" (click)="buy(skin)" [disabled]="loading()">
                          💰 {{ skin.price }}
                        </button>
                      }
                      @if (skin.gemPrice > 0) {
                        <button class="btn gem" (click)="buyWithGems(skin)" [disabled]="loading()">
                          💎 {{ skin.gemPrice }}
                        </button>
                      }
                      @if (skin.price === 0 && skin.gemPrice === 0) {
                        <span class="badge locked-b">{{ 'shop.badge_locked' | translate }}</span>
                      }
                    </div>
                  }
                </div>

              </div>
            }
          </div>

        } @else {
          <!-- Paquetes de gemas -->
          <div class="packages-view">
            <h2 class="section-title">{{ 'shop.packages_title' | translate }}</h2>
            <p class="section-sub">{{ 'shop.packages_sub' | translate }}</p>
            <div class="packages-grid">
              @for (pkg of packages(); track pkg.id) {
                <div class="pkg-card">
                  <div class="pkg-row gem">💎 {{ pkg.premiumCoins.toLocaleString() }}</div>
                  <div class="pkg-row coins">🪙 {{ pkg.coins.toLocaleString() }}</div>
                  <hr class="pkg-divider">
                  <div class="pkg-price">\${{ (pkg.amountCents / 100).toFixed(2) }}</div>
                  <div class="pkg-label">{{ pkg.label }}</div>
                  <button class="btn primary pkg-btn" (click)="startCheckout(pkg)" [disabled]="loading()">
                    {{ 'shop.btn_buy' | translate }}
                  </button>
                </div>
              }
            </div>
            <p class="stripe-note">{{ 'shop.stripe_note' | translate }}</p>
          </div>
        }

      </div><!-- /scroll-area -->
    </div><!-- /shop-root -->

    <!-- ── Modal de checkout Stripe ───────────────────────────── -->
    @if (checkoutPkg() && checkoutSecret()) {
      <app-stripe-checkout
        [pkg]="checkoutPkg()!"
        [clientSecret]="checkoutSecret()!"
        (cancel)="closeCheckout()"
        (success)="onPaymentSuccess()"
      />
    }
  `,
  styles: [`
    /* ── Layout raíz: sin scroll de página ──────────────────────── */
    :host { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

    .shop-root {
      height: 100vh;
      display: flex; flex-direction: column;
      overflow: hidden;
      background: var(--t-bg);
      color: var(--t-tx);
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── Header ─────────────────────────────────────────────────── */
    .shop-header {
      display: flex; align-items: center; gap: 16px;
      padding: 12px 24px;
      border-bottom: 1px solid var(--t-accent-bd);
      background: var(--t-hdr-bg);
      backdrop-filter: blur(10px);
      flex-shrink: 0;
    }
    .logo { display: flex; align-items: center; gap: 8px; flex: 1; }
    .logo-icon { font-size: 18px; }
    .logo-text { font-size: 13px; font-weight: 800; letter-spacing: 3px; color: var(--t-accent); }
    .wallet-bar { display: flex; align-items: center; gap: 14px; }
    .wallet-coins { color: var(--t-daily-btn, #ffd600); font-size: 14px; font-weight: 700; }
    .wallet-gems  { color: #ab47bc; font-size: 14px; font-weight: 700; }
    .back-btn {
      color: var(--t-tx4); text-decoration: none; font-size: 13px;
      padding: 6px 14px; border: 1px solid var(--t-bd2); border-radius: 6px;
      transition: color 0.15s, border-color 0.15s;
    }
    .back-btn:hover { color: var(--t-accent); border-color: var(--t-accent-bd2); }

    /* ── Progresión strip ────────────────────────────────────────── */
    .prog-strip {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding: 8px 24px;
      background: var(--t-strip-bg);
      border-bottom: 1px solid var(--t-bd);
      font-size: 12px; color: var(--t-tx4);
      flex-shrink: 0;
    }
    .prog-info strong { color: var(--t-tx); }
    .prog-next-label { color: var(--t-tx4); }
    .prog-next-name { font-size: 13px; }
    .prog-track {
      width: 100px; height: 5px;
      background: var(--t-surface2); border-radius: 3px; overflow: hidden;
    }
    .prog-fill { height: 100%; border-radius: 3px; transition: width 0.4s; min-width: 2px; }
    .prog-pct { color: var(--t-tx); font-weight: 700; }
    .prog-cnt { color: var(--t-muted); font-size: 11px; }
    .prog-done { color: var(--t-accent); font-weight: 600; }

    /* ── Notificación ────────────────────────────────────────────── */
    .notif {
      margin: 0 24px 0;
      padding: 9px 14px;
      border-radius: 0 0 8px 8px;
      background: var(--t-accent-bg); border: 1px solid var(--t-accent-bd);
      color: var(--t-accent); font-size: 13px;
      flex-shrink: 0;
    }
    .notif.error { background: rgba(244,67,54,0.1); border-color: rgba(244,67,54,0.25); color: #ef5350; }

    /* ── Tabs ────────────────────────────────────────────────────── */
    .tabs {
      display: flex; align-items: center; gap: 2px;
      padding: 0 24px;
      border-bottom: 2px solid var(--t-bd);
      overflow-x: auto;
      flex-shrink: 0;
    }
    .sub-tabs {
      display: flex; align-items: center; gap: 2px;
      padding: 0 24px;
      border-bottom: 1px solid var(--t-bd);
      background: var(--t-strip-bg);
      overflow-x: auto;
      flex-shrink: 0;
    }
    .sub-tabs .tab { font-size: 11px; padding: 7px 12px; }
    .tab {
      display: flex; align-items: center; gap: 5px;
      padding: 10px 14px;
      background: transparent; border: none;
      border-bottom: 2px solid transparent;
      color: var(--t-muted); font-size: 12px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab.active { color: var(--t-tx); border-bottom-color: var(--t-accent); }
    .tab:hover:not(.active) { color: var(--t-tx4); }
    .tab-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

    /* ── Área con scroll ────────────────────────────────────────── */
    .scroll-area {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px 24px;
    }
    .scroll-area::-webkit-scrollbar { width: 6px; }
    .scroll-area::-webkit-scrollbar-track { background: transparent; }
    .scroll-area::-webkit-scrollbar-thumb { background: var(--t-bd2); border-radius: 3px; }
    .scroll-area::-webkit-scrollbar-thumb:hover { background: var(--t-bd); }

    /* ── Grid de skins ──────────────────────────────────────────── */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 14px;
    }
    .card {
      background: var(--t-surface);
      border: 1px solid var(--t-bd);
      border-radius: 12px;
      padding: 13px;
      display: flex; flex-direction: column; gap: 7px;
      transition: border-color 0.2s, transform 0.15s;
    }
    .card:hover {
      transform: translateY(-1px);
      border-color: var(--t-accent-bd2);
      box-shadow: 0 0 16px var(--t-accent-glow);
    }
    .card.equipped { background: var(--t-accent-bg); }

    .preview {
      width: 100%; height: 96px;
      border-radius: 9px; position: relative;
      display: flex; align-items: center; justify-content: center;
      gap: 6px;
      background: var(--t-surface2);
      flex-shrink: 0; padding: 6px;
    }
    .preview-part {
      display: flex; flex-direction: column; align-items: center; gap: 3px;
      flex: 1;
    }
    .preview-sep {
      width: 1px; height: 52px;
      background: var(--t-bd);
      flex-shrink: 0;
    }
    .skin-img {
      width: 58px; height: 58px;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .skin-cannon-img {
      width: 48px; height: 48px;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .part-lbl {
      font-size: 8px; color: var(--t-muted);
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .equipped-flag { position: absolute; top: 5px; right: 7px; font-size: 13px; }

    .rarity { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }
    .skin-name { font-size: 13px; font-weight: 700; color: var(--t-tx); line-height: 1.3; }
    .skin-desc { font-size: 10px; color: var(--t-muted); line-height: 1.4; }

    /* Bonuses */
    .bonuses { display: flex; flex-wrap: wrap; gap: 3px; }
    .bc {
      font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
    }
    .bc.speed  { background: rgba(33,150,243,0.2); color: #64b5f6; }
    .bc.hp     { background: rgba(244,67,54,0.2);  color: #ef9a9a; }
    .bc.ammo   { background: rgba(255,235,59,0.2); color: #b5930a; }
    .bc.wall   { background: rgba(121,85,72,0.3);  color: #bcaaa4; }
    .bc.bullet { background: rgba(0,188,212,0.2);  color: #0097a7; }
    .bc.xp     { background: rgba(156,39,176,0.2); color: #ce93d8; }
    .bc.coin   { background: rgba(255,152,0,0.2);  color: #ff9800; }

    /* Unlock bar */
    .unlock-wrap { display: flex; flex-direction: column; gap: 3px; }
    .unlock-track { height: 3px; background: var(--t-surface2); border-radius: 2px; overflow: hidden; }
    .unlock-fill  { height: 100%; border-radius: 2px; transition: width 0.3s; min-width: 2px; }
    .unlock-txt   { font-size: 9px; color: var(--t-muted); }

    /* Actions */
    .card-actions { margin-top: auto; display: flex; flex-direction: column; gap: 5px; }
    .price-row { display: flex; gap: 5px; }
    .btn {
      padding: 7px 10px;
      border: none; border-radius: 6px;
      font-size: 11px; font-weight: 700;
      cursor: pointer; font-family: inherit;
      transition: opacity 0.15s;
      flex: 1;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn.primary {
      background: linear-gradient(135deg, var(--t-accent-dk), var(--t-accent));
      color: var(--t-on-accent);
      box-shadow: 0 0 12px var(--t-accent-glow);
    }
    .btn.primary:not(:disabled):hover { opacity: 0.9; box-shadow: 0 0 20px var(--t-accent-glow2); }
    .btn.gem     { background: linear-gradient(135deg, #5b21b6, #7c3aed); color: #fff; }
    .btn.preview { background: var(--t-surface2); border: 1px solid var(--t-bd2); color: var(--t-tx4); font-size: 10px; }
    .btn.coin-buy {
      background: linear-gradient(135deg, #92400e, #f59e0b);
      color: #fff;
      box-shadow: 0 0 10px rgba(245,158,11,.35);
    }
    .btn.coin-buy:not(:disabled):hover { opacity: 0.9; box-shadow: 0 0 18px rgba(245,158,11,.55); }
    .btn.claim { background: linear-gradient(135deg, var(--t-daily-bonus, #f9a825), #b45309); color: #fff; }
    .btn.outline { background: var(--t-ghost-bg); border: 1px solid var(--t-ghost-bd); color: var(--t-ghost-tx); }
    .badge {
      font-size: 10px; font-weight: 700; padding: 3px 8px;
      border-radius: 4px; text-align: center;
    }
    .badge.owned-b    { background: var(--t-accent-bg); color: var(--t-accent); }
    .badge.equipped-b { background: var(--t-accent-bg); color: var(--t-accent); }
    .badge.locked-b   { background: var(--t-surface2); color: var(--t-muted); font-size: 9px; }

    /* ── Vista de paquetes ──────────────────────────────────────── */
    .packages-view {
      max-width: 700px; margin: 0 auto; padding: 8px 0;
    }
    .section-title { font-size: 18px; font-weight: 800; color: #ab47bc; margin: 0 0 8px; }
    .section-sub { font-size: 13px; color: var(--t-tx4); margin: 0 0 20px; line-height: 1.6; }
    .packages-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px;
    }
    .pkg-card {
      background: var(--t-surface);
      border: 1px solid var(--t-bd);
      border-radius: 12px; padding: 20px;
      text-align: center;
      display: flex; flex-direction: column; gap: 8px;
    }
    .pkg-row.gem   { font-size: 24px; font-weight: 800; color: #ab47bc; }
    .pkg-row.coins { font-size: 13px; font-weight: 600; color: #f1c40f; }
    .pkg-divider   { border: none; border-top: 1px solid var(--t-bd); margin: 4px 0; }
    .pkg-price     { font-size: 20px; font-weight: 800; color: var(--t-tx); }
    .pkg-label     { font-size: 11px; color: var(--t-tx4); }
    .pkg-btn   { padding: 10px; font-size: 13px; margin-top: 4px; }
    .stripe-note { font-size: 11px; color: var(--t-muted); margin-top: 20px; text-align: center; }

    /* ── Vista de escenarios ────────────────────────────────────── */
    .arenas-view { max-width: none; }
    .arena-shop-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 14px; margin-top: 16px;
    }
    .arena-shop-card {
      background: var(--t-surface); border: 1px solid var(--t-bd);
      border-radius: 12px; overflow: hidden;
      transition: border-color 0.2s, transform 0.15s;
    }
    .arena-shop-card:hover { transform: translateY(-1px); }
    .arena-equipped { border-color: #9c27b0 !important; background: rgba(156,39,176,0.06); }
    .arena-shop-thumb {
      width: 100%; height: 100px; position: relative;
      background: #1a1a1e; background-size: cover; background-position: center;
      overflow: hidden;
    }
    .arena-shop-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .arena-equipped-badge {
      position: absolute; bottom: 6px; left: 6px;
      background: #9c27b0; color: #fff;
      font-size: 9px; font-weight: 800;
      padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px;
    }
    .arena-lock-overlay {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.4); font-size: 22px;
    }
    .arena-shop-info { padding: 12px; display: flex; flex-direction: column; gap: 5px; }
    .arena-shop-name { font-size: 13px; font-weight: 700; color: var(--t-tx); }
    .arena-shop-desc { font-size: 11px; color: var(--t-muted); line-height: 1.4; }
    .arena-shop-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 4px; }

    /* ── Vista de avatares ──────────────────────────────────────── */
    .avatars-view { max-width: none; }
    .av-cats {
      display: flex; gap: 4px; flex-wrap: wrap; margin: 12px 0 16px;
    }
    .avatar-shop-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
    }
    .avatar-shop-card {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      padding: 10px 6px;
      border-radius: 10px;
      border: 1.5px solid var(--t-bd);
      background: var(--t-surface);
      transition: border-color 0.15s, transform 0.1s;
    }
    .avatar-shop-card:hover { border-color: var(--t-accent-bd2); transform: translateY(-2px); }
    .avatar-shop-card.av-equipped {
      border-color: var(--t-accent);
      background: var(--t-accent-bg);
      box-shadow: 0 0 10px var(--t-accent-glow);
    }
    .avatar-shop-card:not(.av-owned) { opacity: 0.8; }
    .av-img-wrap {
      position: relative; width: 64px; height: 64px;
    }
    .av-img {
      width: 64px; height: 64px; object-fit: contain; border-radius: 8px; display: block;
    }
    .av-equipped-badge {
      position: absolute; top: -4px; right: -4px;
      background: var(--t-accent); color: var(--t-on-accent);
      border-radius: 50%; width: 18px; height: 18px;
      font-size: 10px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .av-lock {
      position: absolute; bottom: 0; right: -2px; font-size: 14px;
    }
    .av-name {
      font-size: 9px; color: var(--t-tx); text-align: center; font-weight: 600;
      line-height: 1.3;
    }
    .av-price {
      font-size: 9px; color: var(--t-muted); font-weight: 600;
    }
    .av-price.free { color: var(--t-accent); }
    .av-actions { width: 100%; }

    /* ══════════════════════════════════════════════════════════════
       RESPONSIVE MOBILE
       ══════════════════════════════════════════════════════════════ */
    @media (max-width: 768px) {
      /* Header compacto */
      .shop-header { padding: 10px 16px; gap: 10px; }
      .logo-text { font-size: 11px; letter-spacing: 1.5px; }
      .wallet-bar { gap: 8px; }
      .wallet-coins, .wallet-gems { font-size: 12px; }
      .back-btn { padding: 5px 10px; font-size: 12px; }

      /* Tabs: scrollables sin wrapping */
      .tabs {
        padding: 0 12px;
        overflow-x: auto;
        overflow-y: hidden;
        flex-wrap: nowrap;
        gap: 0;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      .tabs::-webkit-scrollbar { display: none; }
      .tab { padding: 10px 12px; font-size: 11px; white-space: nowrap; }
      .tabs-sep { display: none; }

      /* Progresión strip */
      .prog-strip { padding: 7px 16px; gap: 7px; font-size: 11px; }
      .prog-track { width: 70px; }

      /* Scroll area */
      .scroll-area { padding: 12px 12px 20px; }

      /* Grid de skins: 2 columnas */
      .grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .card { padding: 10px; gap: 6px; }
      .preview { height: 80px; }
      .skin-img { width: 46px; height: 46px; }
      .skin-cannon-img { width: 38px; height: 38px; }
      .skin-name { font-size: 12px; }
      .skin-desc { display: none; }

      /* Grid de escenarios: 2 columnas */
      .arena-shop-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .arena-shop-thumb { height: 80px; }
      .arena-shop-info { padding: 9px; }
      .arena-shop-name { font-size: 12px; }
      .arena-shop-desc { font-size: 10px; }

      /* Avatar grid: más compacto */
      .avatar-shop-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
      .av-img-wrap { width: 52px; height: 52px; }
      .av-img { width: 52px; height: 52px; }

      /* Paquetes: 2 columnas */
      .packages-grid { grid-template-columns: repeat(2, 1fr); }
      .pkg-card { padding: 14px 10px; }
      .pkg-gems { font-size: 20px; }
      .pkg-price { font-size: 17px; }
    }

    @media (max-width: 480px) {
      .shop-header { flex-wrap: wrap; gap: 8px; padding: 10px 12px; }
      .logo { min-width: 0; }
      .logo-text { display: none; }
      .wallet-bar { order: 3; }
      .back-btn { order: 2; }
      .grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .scroll-area { padding: 10px; }
    }
  `],
})
export class ShopComponent implements OnInit {
  private readonly avatarsSvc = inject(AvatarsService);
  private readonly translate  = inject(TranslateService);

  readonly coins          = signal(0);
  readonly gems           = signal(0);
  readonly skins          = signal<Skin[]>([]);
  readonly filteredSkins  = signal<Skin[]>([]);
  readonly packages       = signal<CoinPackage[]>([]);
  readonly progression    = signal<SkinProgression | null>(null);
  readonly activeFilter   = signal<Filter>('all');
  readonly section        = signal<'tanks'|'avatars'|'arenas'|'packages'>('tanks');
  readonly loading        = signal(false);
  readonly notif          = signal('');
  readonly notifError     = signal(false);

  // Stripe checkout state
  readonly checkoutPkg    = signal<CoinPackage | null>(null);
  readonly checkoutSecret = signal<string | null>(null);

  readonly arenaSkinsAvailable = signal<ArenaSkinItem[]>([]);
  readonly activeArenaSlug     = signal<string>('default');
  readonly arenaLoading        = signal(false);

  // Avatares
  readonly allAvatars       = signal<AvatarItem[]>([]);
  readonly filteredAvatars  = signal<AvatarItem[]>([]);
  readonly activeAvatarCat  = signal<string>('all');
  readonly activeAvatarSlug = signal(this.avatarsSvc.getActiveSlug());
  readonly avatarLoading    = signal(false);

  readonly avatarCategories = [
    { key: 'all' },
    { key: 'animals' },
    { key: 'food' },
    { key: 'characters' },
    { key: 'fantasy' },
    { key: 'symbols' },
  ];

  readonly filters: Filter[] = ['all', 'common', 'rare', 'epic', 'legendary'];

  constructor(
    private readonly skinsService: SkinsService,
    private readonly arenaSkinService: ArenaSkinService,
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.loadSkins();
    this.loadPackages();
    this.loadWallet();
    this.loadProgression();
    this.activeArenaSlug.set(this.arenaSkinService.getActiveSlug());

    // Handle return from Stripe redirect and section navigation
    this.route.queryParams.subscribe(params => {
      if (params['payment'] === 'success') {
        this.showNotif(this.translate.instant('shop.payment_redirect_success'));
        this.loadWallet();
      }
      if (params['section'] === 'arenas') {
        this.setArenaView();
      }
      if (params['section'] === 'avatars') {
        this.setAvatarView();
      }
    });
  }

  rarityColor(r: string): string { return RARITY_COLOR[r] ?? '#fff'; }
  rarityLabel(r: string): string { return this.translate.instant(`shop.rarity_${r}`) || r; }
  bonusSummary(skin: Skin): string { return this.skinsService.bonusSummary(skin); }
  skinSlug(name: string): string { return nameToSlug(name); }

  skinName(name: string): string {
    const key = 'skins.' + nameToSlug(name);
    const t = this.translate.instant(key);
    return t === key ? name : t;
  }

  arenaName(slug: string, fallbackName: string): string {
    if (slug === 'default') return this.translate.instant('shop.default_arena_name');
    const key = 'arenas.' + slug;
    const t = this.translate.instant(key);
    return t === key ? fallbackName : t;
  }

  avatarName(slug: string, fallback: string): string {
    const key = 'avatars.' + slug;
    const t = this.translate.instant(key);
    return t === key ? fallback : t;
  }

  onImgError(event: Event, fallbackColor: string): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) parent.style.background = fallbackColor;
  }

  filterLabel(f: Filter): string {
    return f === 'all'
      ? this.translate.instant('shop.filter_all')
      : this.translate.instant(`shop.rarity_${f}`) || f;
  }

  unlockPct(skin: Skin): number {
    if (!skin.matchesUnlock || !this.progression()) return 0;
    return Math.min(100, Math.floor((this.progression()!.gamesPlayed / skin.matchesUnlock) * 100));
  }

  previewArena(slug: string): void {
    this.arenaSkinService.equipLocal(slug);
    this.activeArenaSlug.set(slug);
    const arena = this.arenaSkinsAvailable().find(s => s.slug === slug);
    const name = this.arenaName(slug, arena?.name ?? slug);
    this.showNotif(this.translate.instant('shop.arena_preview_notif', { name }));
  }

  setSection(s: 'tanks'|'avatars'|'arenas'|'packages'): void {
    this.section.set(s);
    if (s === 'arenas'  && !this.arenaSkinsAvailable().length) this.loadArenaSkinsData();
    if (s === 'avatars' && !this.allAvatars().length)          this.loadAvatarData();
  }

  setArenaView(): void  { this.setSection('arenas');  }
  setAvatarView(): void { this.setSection('avatars'); }

  setAvatarCat(cat: string): void {
    this.activeAvatarCat.set(cat);
    const base = this.allAvatars();
    this.filteredAvatars.set(cat === 'all' ? base : base.filter(a => a.category === cat));
  }

  equipAvatar(avatar: AvatarItem): void {
    this.loading.set(true);
    this.avatarsSvc.equip(avatar.slug).subscribe({
      next: () => {
        this.activeAvatarSlug.set(avatar.slug);
        this.allAvatars.update(list => list.map(a => ({ ...a, equipped: a.slug === avatar.slug, owned: a.owned || a.slug === avatar.slug })));
        this.setAvatarCat(this.activeAvatarCat());
        this.showNotif(this.translate.instant('shop.avatar_equipped_notif', { name: this.avatarName(avatar.slug, avatar.name) }));
        this.loading.set(false);
      },
      error: (e) => { this.showNotif(e?.error?.message ?? this.translate.instant('shop.equip_error'), true); this.loading.set(false); },
    });
  }

  buyAvatar(avatar: AvatarItem): void {
    this.loading.set(true);
    this.avatarsSvc.purchase(avatar.slug).subscribe({
      next: () => {
        this.showNotif(this.translate.instant('shop.avatar_bought_notif'));
        this.loadWallet();
        this.loadAvatarData();
        this.loading.set(false);
      },
      error: (e) => { this.showNotif(e?.error?.message ?? this.translate.instant('shop.coins_insufficient'), true); this.loading.set(false); },
    });
  }

  onAvatarImgErr(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/avatars/avatar-01.png';
    (event.target as HTMLImageElement).onerror = null;
  }

  setFilter(f: Filter): void {
    this.activeFilter.set(f);
    this.section.set('tanks');
    const all = this.skins();
    this.filteredSkins.set(f === 'all' ? all : all.filter(s => s.rarity === f));
  }

  buy(skin: Skin): void {
    this.loading.set(true);
    this.skinsService.purchase(skin.id).subscribe({
      next: () => {
        this.showNotif(this.translate.instant('shop.skin_bought_notif', { name: skin.name }));
        this.loadSkins(); this.loadWallet(); this.loading.set(false);
      },
      error: err => {
        this.showNotif(err?.error?.message ?? this.translate.instant('shop.coins_insufficient'), true);
        this.loading.set(false);
      },
    });
  }

  buyWithGems(skin: Skin): void {
    this.loading.set(true);
    this.skinsService.purchaseWithGems(skin.id).subscribe({
      next: () => {
        this.showNotif(this.translate.instant('shop.skin_bought_gems_notif', { name: skin.name }));
        this.loadSkins(); this.loadWallet(); this.loading.set(false);
      },
      error: err => {
        this.showNotif(err?.error?.message ?? this.translate.instant('shop.gems_insufficient'), true);
        this.loading.set(false);
      },
    });
  }

  claimFree(skin: Skin): void {
    this.loading.set(true);
    this.skinsService.claimFree(skin.id).subscribe({
      next: () => {
        this.showNotif(this.translate.instant('shop.skin_claimed_notif', { name: skin.name }));
        this.loadSkins(); this.loadProgression(); this.loading.set(false);
      },
      error: err => {
        this.showNotif(err?.error?.message ?? this.translate.instant('shop.claim_error'), true);
        this.loading.set(false);
      },
    });
  }

  equip(skin: Skin): void {
    this.skinsService.equip(skin.id).subscribe({
      next: () => { this.showNotif(this.translate.instant('shop.skin_equipped_notif', { name: skin.name })); this.loadSkins(); },
      error: () => this.showNotif(this.translate.instant('shop.equip_error'), true),
    });
  }

  unequip(): void {
    this.skinsService.unequip().subscribe({
      next: () => { this.showNotif(this.translate.instant('shop.skin_unequipped')); this.loadSkins(); },
      error: () => {},
    });
  }

  startCheckout(pkg: CoinPackage): void {
    if (environment.stripePublishableKey.includes('REPLACE')) {
      this.showNotif('Stripe no está configurado aún. Añade la clave en environment.ts', true);
      return;
    }
    this.loading.set(true);
    this.skinsService.createPaymentIntent(pkg.id).subscribe({
      next: ({ clientSecret }) => {
        this.checkoutPkg.set(pkg);
        this.checkoutSecret.set(clientSecret);
        this.loading.set(false);
      },
      error: () => {
        this.showNotif(this.translate.instant('shop.payment_error'), true);
        this.loading.set(false);
      },
    });
  }

  closeCheckout(): void {
    this.checkoutPkg.set(null);
    this.checkoutSecret.set(null);
  }

  onPaymentSuccess(): void {
    this.closeCheckout();
    this.showNotif(this.translate.instant('shop.payment_success_notif'));
    setTimeout(() => this.loadWallet(), 2000);
  }

  equipArena(slug: string): void {
    this.loading.set(true);
    this.arenaSkinService.equip(slug).subscribe({
      next: () => {
        this.activeArenaSlug.set(slug);
        this.arenaSkinsAvailable.update(list => list.map(s => ({ ...s, equipped: s.slug === slug })));
        const aName = this.arenaSkinsAvailable().find(s => s.slug === slug)?.name ?? slug;
        this.showNotif(this.translate.instant('shop.arena_equipped_notif', { name: aName }));
        this.loading.set(false);
      },
      error: () => { this.showNotif(this.translate.instant('shop.arena_equip_error'), true); this.loading.set(false); },
    });
  }

  buyArena(skin: ArenaSkinItem): void {
    this.loading.set(true);
    this.arenaSkinService.purchase(skin.slug).subscribe({
      next: () => {
        this.showNotif(this.translate.instant('shop.arena_bought_notif', { name: skin.name }));
        this.loadWallet();
        this.loadArenaSkinsData();
        this.loading.set(false);
      },
      error: err => {
        this.showNotif(err?.error?.message ?? this.translate.instant('shop.gems_insufficient'), true);
        this.loading.set(false);
      },
    });
  }

  private loadAvatarData(): void {
    this.avatarLoading.set(true);
    this.avatarsSvc.list().subscribe({
      next: items => {
        this.allAvatars.set(items);
        const equipped = items.find(a => a.equipped);
        if (equipped) this.activeAvatarSlug.set(equipped.slug);
        this.setAvatarCat(this.activeAvatarCat());
        this.avatarLoading.set(false);
      },
      error: () => this.avatarLoading.set(false),
    });
  }

  private loadArenaSkinsData(): void {
    this.arenaLoading.set(true);
    this.arenaSkinService.list().subscribe({
      next: skins => {
        this.arenaSkinsAvailable.set(skins);
        const equipped = skins.find(s => s.equipped);
        if (equipped) this.activeArenaSlug.set(equipped.slug);
        this.arenaLoading.set(false);
      },
      error: () => this.arenaLoading.set(false),
    });
  }

  private loadSkins(): void {
    this.skinsService.getMySkins().subscribe({
      next: skins => {
        this.skins.set(skins);
        this.setFilter(this.activeFilter());
      },
      error: () => {
        this.skinsService.getSkins().subscribe(skins => {
          this.skins.set(skins);
          this.setFilter(this.activeFilter());
        });
      },
    });
  }

  private loadPackages(): void {
    this.skinsService.getPackages().subscribe({ next: p => this.packages.set(p), error: () => {} });
  }

  private loadWallet(): void {
    this.http.get<{ coins: number; premiumCoins: number }>(`${environment.apiUrl}/economy/wallet`).subscribe({
      next: w => { this.coins.set(w.coins); this.gems.set(w.premiumCoins); },
      error: () => {},
    });
  }

  private loadProgression(): void {
    this.skinsService.getProgression().subscribe({
      next: p => this.progression.set(p),
      error: () => {},
    });
  }

  private showNotif(msg: string, error = false): void {
    this.notif.set(msg);
    this.notifError.set(error);
    setTimeout(() => this.notif.set(''), 5000);
  }
}
