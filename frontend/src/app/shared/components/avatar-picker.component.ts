import {
  Component, Input, Output, EventEmitter, OnInit, signal, inject, computed,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AvatarsService, AvatarItem } from '../../core/services/avatars.service';
import { AuthService } from '../../core/services/auth.service';

type Category = 'all' | 'animals' | 'food' | 'characters' | 'fantasy' | 'symbols';

@Component({
  selector: 'app-avatar-picker',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="ap-backdrop" (click)="close.emit()">
      <div class="ap-modal" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="ap-hdr">
          <span class="ap-title">{{ ownedOnly ? ('avatar_picker.my_avatars' | translate) : ('avatar_picker.select' | translate) }}</span>
          <div class="ap-cats">
            @for (cat of categories; track cat) {
              <button class="ap-cat-btn" [class.active]="activeCategory() === cat"
                      (click)="setCategory(cat)">
                {{ catLabel(cat) }}
              </button>
            }
          </div>
          <button class="ap-close" (click)="close.emit()">✕</button>
        </div>

        <!-- Notification -->
        @if (notif()) {
          <div class="ap-notif" [class.error]="notifError()">{{ notif() }}</div>
        }

        <!-- Grid -->
        <div class="ap-grid-wrap">
          @if (loading()) {
            <div class="ap-loading">{{ 'avatar_picker.loading' | translate }}</div>
          } @else {
            <div class="ap-grid">
              @for (a of filtered(); track a.slug) {
                <div class="ap-card"
                     [class.equipped]="a.slug === currentSlug()"
                     [class.owned]="a.owned"
                     [class.locked]="!a.owned"
                     (click)="onCard(a)">
                  <div class="ap-img-wrap">
                    <img class="ap-img"
                         [src]="avatarUrl(a.slug)"
                         [alt]="a.name"
                         (error)="onImgErr($event, a.slug)">
                    @if (a.slug === currentSlug()) {
                      <div class="ap-equipped-badge">✓</div>
                    }
                    @if (!a.owned) {
                      <div class="ap-lock">🔒</div>
                    }
                  </div>
                  <span class="ap-name">{{ avatarName(a.slug, a.name) }}</span>
                  <span class="ap-price" [class.free]="a.priceCoins === 0">
                    {{ tierLabel(a.priceCoins) }}
                  </span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        @if (!loading() && hasLocked()) {
          <div class="ap-footer">
            <span class="ap-footer-hint">{{ 'avatar_picker.want_more' | translate }}</span>
            <button class="ap-shop-btn" (click)="goToShop.emit(); close.emit()">
              {{ 'avatar_picker.get_more' | translate }}
            </button>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .ap-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.82);
      backdrop-filter: blur(5px);
      z-index: 200;
      display: flex; align-items: center; justify-content: center;
      padding: 12px;
    }
    .ap-modal {
      background: var(--t-panel);
      border: 1px solid var(--t-accent-bd);
      border-radius: 16px;
      width: 100%; max-width: 900px;
      max-height: 92vh;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 50px var(--t-accent-glow);
    }
    .ap-hdr {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--t-panel-bd);
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .ap-title {
      font-size: 14px; font-weight: 800;
      letter-spacing: 2px; color: var(--t-accent);
      white-space: nowrap;
    }
    .ap-cats {
      display: flex; gap: 6px; flex-wrap: wrap; flex: 1;
    }
    .ap-cat-btn {
      background: transparent;
      border: 1px solid var(--t-panel-bd);
      color: var(--t-muted);
      border-radius: 20px;
      padding: 5px 12px;
      font-size: 11px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: all 0.15s;
    }
    .ap-cat-btn.active, .ap-cat-btn:hover {
      border-color: var(--t-accent);
      color: var(--t-accent);
      background: var(--t-accent-bg);
    }
    .ap-close {
      background: transparent; border: 1px solid var(--t-bd);
      color: var(--t-tx); border-radius: 7px; padding: 6px 12px;
      cursor: pointer; font-family: inherit; font-size: 13px;
      flex-shrink: 0;
    }
    .ap-close:hover { background: var(--t-surface); }

    .ap-notif {
      padding: 10px 20px;
      font-size: 12px; font-weight: 600;
      color: var(--t-accent);
      background: var(--t-accent-bg);
      border-bottom: 1px solid var(--t-accent-bd);
    }
    .ap-notif.error { color: var(--t-err); background: rgba(255,100,100,0.06); }

    .ap-grid-wrap {
      flex: 1; overflow-y: auto;
      padding: 16px 20px;
      scrollbar-width: thin;
      scrollbar-color: var(--t-accent-bd2) transparent;
    }
    .ap-grid-wrap::-webkit-scrollbar { width: 5px; }
    .ap-grid-wrap::-webkit-scrollbar-thumb { background: var(--t-accent-bd2); border-radius: 3px; }

    .ap-loading { font-size: 13px; color: var(--t-dim); text-align: center; padding: 40px; }

    .ap-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
    }

    .ap-card {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      padding: 10px 6px;
      border-radius: 10px;
      border: 1.5px solid var(--t-panel-bd);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s, transform 0.1s;
      background: var(--t-surface);
    }
    .ap-card:hover { border-color: var(--t-accent); transform: translateY(-2px); }
    .ap-card.equipped {
      border-color: var(--t-accent);
      background: var(--t-accent-bg);
      box-shadow: 0 0 10px var(--t-accent-glow);
    }
    .ap-card.locked { opacity: 0.72; }

    .ap-img-wrap {
      position: relative;
      width: 64px; height: 64px;
    }
    .ap-img {
      width: 64px; height: 64px;
      object-fit: contain;
      border-radius: 8px;
      display: block;
    }
    .ap-equipped-badge {
      position: absolute; top: -4px; right: -4px;
      background: var(--t-accent);
      color: var(--t-on-accent);
      border-radius: 50%;
      width: 18px; height: 18px;
      font-size: 10px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .ap-lock {
      position: absolute; bottom: 0; right: -2px;
      font-size: 14px;
    }

    .ap-name {
      font-size: 10px; color: var(--t-tx);
      text-align: center; line-height: 1.3;
      font-weight: 600;
    }
    .ap-price {
      font-size: 10px; color: var(--t-muted);
      font-weight: 600;
    }
    .ap-price.free { color: var(--t-accent); }

    .ap-footer {
      display: flex; align-items: center; justify-content: center; gap: 14px;
      padding: 12px 20px;
      border-top: 1px solid var(--t-panel-bd);
      flex-shrink: 0;
    }
    .ap-footer-hint {
      font-size: 12px; color: var(--t-muted); font-weight: 500;
    }
    .ap-shop-btn {
      background: var(--t-accent);
      color: var(--t-on-accent, #000);
      border: none; border-radius: 8px;
      padding: 8px 18px;
      font-size: 12px; font-weight: 700;
      cursor: pointer; font-family: inherit;
      transition: opacity 0.15s, transform 0.1s;
    }
    .ap-shop-btn:hover { opacity: 0.88; transform: translateY(-1px); }

    @media (max-width: 768px) {
      .ap-backdrop { padding: 0; align-items: flex-end; }
      .ap-modal {
        max-width: 100%; width: 100%;
        max-height: 92vh;
        border-radius: 20px 20px 0 0;
        border-left: none; border-right: none; border-bottom: none;
      }
      .ap-hdr { padding: 14px 16px; gap: 10px; }
      .ap-title { font-size: 12px; }
      .ap-cats { gap: 4px; }
      .ap-cat-btn { padding: 4px 10px; font-size: 10px; }
      .ap-grid-wrap { padding: 12px 14px; }
      .ap-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
      .ap-img-wrap { width: 52px; height: 52px; }
      .ap-img { width: 52px; height: 52px; }
    }
  `],
})
export class AvatarPickerComponent implements OnInit {
  @Input() ownedOnly = false;
  @Output() close = new EventEmitter<void>();
  @Output() equipped = new EventEmitter<string>();
  @Output() goToShop = new EventEmitter<void>();

  private readonly avatarsSvc = inject(AvatarsService);
  private readonly authSvc    = inject(AuthService);
  private readonly translate  = inject(TranslateService);

  readonly categories: Category[] = ['all', 'animals', 'food', 'characters', 'fantasy', 'symbols'];
  readonly activeCategory = signal<Category>('all');
  readonly loading  = signal(true);
  readonly notif    = signal('');
  readonly notifError = signal(false);
  readonly currentSlug = signal(this.avatarsSvc.getActiveSlug());

  private allAvatars: AvatarItem[] = [];
  readonly filtered = signal<AvatarItem[]>([]);
  readonly hasLocked = computed(() => this.allAvatars.some(a => !a.owned));

  ngOnInit(): void {
    this.avatarsSvc.list().subscribe({
      next: items => {
        this.allAvatars = items;
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setCategory(cat: Category): void {
    this.activeCategory.set(cat);
    this.applyFilter();
  }

  catLabel(cat: Category): string {
    return this.translate.instant(`avatar_picker.cat_${cat}`);
  }

  avatarName(slug: string, fallback: string): string {
    const key = 'avatars.' + slug;
    const t = this.translate.instant(key);
    return t === key ? fallback : t;
  }

  tierLabel(price: number): string {
    return price === 0
      ? this.translate.instant('avatar_picker.tier_free')
      : this.translate.instant('avatar_picker.tier_coins', { price });
  }

  avatarUrl(slug: string): string {
    return this.avatarsSvc.getAvatarUrl(slug);
  }

  onImgErr(event: Event, slug: string): void {
    const img = event.target as HTMLImageElement;
    img.src = `assets/avatars/avatar-01.png`;
    img.onerror = null;
  }

  onCard(avatar: AvatarItem): void {
    if (!this.authSvc.isLoggedIn) {
      this.showNotif(this.translate.instant('avatar_picker.login_required'), true);
      return;
    }

    if (avatar.slug === this.currentSlug()) return;

    if (!avatar.owned) {
      this.buyAndEquip(avatar);
    } else {
      this.equipAvatar(avatar.slug);
    }
  }

  private buyAndEquip(avatar: AvatarItem): void {
    this.avatarsSvc.purchase(avatar.slug).subscribe({
      next: () => this.equipAvatar(avatar.slug),
      error: (e) => this.showNotif(e?.error?.message ?? this.translate.instant('avatar_picker.buy_error'), true),
    });
  }

  private equipAvatar(slug: string): void {
    this.avatarsSvc.equip(slug).subscribe({
      next: () => {
        this.currentSlug.set(slug);
        this.allAvatars = this.allAvatars.map(a => ({ ...a, equipped: a.slug === slug, owned: a.owned || a.slug === slug }));
        this.applyFilter();
        this.equipped.emit(slug);
        this.showNotif(this.translate.instant('avatar_picker.equipped_ok'), false);
      },
      error: (e) => this.showNotif(e?.error?.message ?? this.translate.instant('avatar_picker.equip_error'), true),
    });
  }

  private applyFilter(): void {
    const cat = this.activeCategory();
    let base = this.ownedOnly ? this.allAvatars.filter(a => a.owned) : this.allAvatars;
    this.filtered.set(cat === 'all' ? base : base.filter(a => a.category === cat));
  }

  private showNotif(msg: string, isError: boolean): void {
    this.notif.set(msg);
    this.notifError.set(isError);
    setTimeout(() => this.notif.set(''), 3000);
  }
}
