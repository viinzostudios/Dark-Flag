import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    adBreak?: (config: Record<string, unknown>) => void;
    adConfig?: (config: Record<string, unknown>) => void;
  }
}

const REWARDED_KEY_PREFIX = 'ast_rewarded_';
const INTERSTITIAL_EXITS_KEY = 'ast_interstitial_exits';
const LAST_PURCHASE_KEY = 'ast_last_purchase';
const DEATH_COUNT_KEY = 'ast_deaths_since_int';
const SESSION_START_KEY = 'ast_session_start';
const LAST_INT_TS_KEY = 'ast_last_int_ts';
const MAX_REWARDED_PER_DAY = 10;
const INTERSTITIAL_EVERY_N_EXITS = 3;
const DEATHS_PER_INTERSTITIAL = 3;
const MIN_SESSION_MS_FOR_INTERSTITIAL = 2 * 60 * 1000;
const DEV_AD_DELAY_MS = 1500;

@Injectable({ providedIn: 'root' })
export class AdsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  constructor() {
    window.adConfig?.({ preloadAdBreaks: 'on', sound: 'off' });
  }

  // ─── Rewarded: ammo boost ──────────────────────────────────────────────────

  showAmmoRewardedAd(onComplete: () => void): void {
    if (!this.canShowRewardedAd()) return;
    this.runRewarded('rewarded_ammo', onComplete);
  }

  // ─── Rewarded: walls boost ─────────────────────────────────────────────────

  showWallsRewardedAd(onComplete: () => void): void {
    if (!this.canShowRewardedAd()) return;
    this.runRewarded('rewarded_walls', onComplete);
  }

  // ─── Interstitial: shown on room exit ─────────────────────────────────────

  showExitInterstitial(): void {
    if (!this.shouldShowExitInterstitial()) return;

    if (!window.adBreak) {
      console.info('[Ads] Exit interstitial simulated (dev)');
      this.onExitInterstitialShown();
      return;
    }

    window.adBreak({
      type: 'next',
      name: 'exit_interstitial',
      afterAd: () => this.onExitInterstitialShown(),
    });
  }

  // ─── Interstitial: shown on death (every 3 deaths OR 2 min played) ─────────

  /** Call when the player enters the game arena. Resets death counter and records session start. */
  startGameSession(): void {
    localStorage.setItem(SESSION_START_KEY, String(Date.now()));
    localStorage.setItem(DEATH_COUNT_KEY, '0');
  }

  /** Call each time the player dies (before tryShowDeathInterstitial). */
  incrementDeathCount(): void {
    const c = parseInt(localStorage.getItem(DEATH_COUNT_KEY) ?? '0', 10);
    localStorage.setItem(DEATH_COUNT_KEY, String(c + 1));
  }

  /**
   * Tries to show a death interstitial.
   * @param onWillShow - called ONLY if the ad will actually show (use it to pause UI)
   * @param afterAd    - called after the ad is dismissed (or immediately if no ad shown)
   *
   * Guarantees that afterAd is always called:
   *  - via adBreakDone callback (H5 Ads API, always fires)
   *  - or via 8s safety timeout if adBreak never responds (e.g. account not activated)
   */
  tryShowDeathInterstitial(onWillShow: () => void, afterAd: () => void): void {
    if (!this.shouldShowDeathInterstitial()) {
      return;
    }

    let resolved = false;
    const resolve = () => {
      if (!resolved) { resolved = true; afterAd(); }
    };

    onWillShow();

    // Safety net: unblock UI if adBreak never calls back (account not activated, no fill, etc.)
    const fallbackTimer = setTimeout(resolve, 8000);

    this.runDeathInterstitial(() => {
      clearTimeout(fallbackTimer);
      resolve();
    });
  }

  // ─── Banner ────────────────────────────────────────────────────────────────

  pushBannerAd(): void {
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch { /* no-op in dev */ }
  }

  // ─── Frecuency helpers ────────────────────────────────────────────────────

  canShowRewardedAd(): boolean {
    const key = REWARDED_KEY_PREFIX + new Date().toISOString().slice(0, 10);
    const count = parseInt(localStorage.getItem(key) ?? '0', 10);
    return count < MAX_REWARDED_PER_DAY;
  }

  onRewardedWatched(): void {
    const key = REWARDED_KEY_PREFIX + new Date().toISOString().slice(0, 10);
    const count = parseInt(localStorage.getItem(key) ?? '0', 10);
    localStorage.setItem(key, String(count + 1));
    if (this.auth.isLoggedIn) {
      this.http.post(`${environment.apiUrl}/economy/ad-reward`, {}).subscribe({ error: () => {} });
    }
  }

  onPurchaseCompleted(): void {
    localStorage.setItem(LAST_PURCHASE_KEY, String(Date.now()));
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private runRewarded(name: string, onComplete: () => void): void {
    if (!window.adBreak) {
      console.info(`[Ads] Rewarded "${name}" simulated (dev)`);
      setTimeout(() => {
        this.onRewardedWatched();
        onComplete();
      }, DEV_AD_DELAY_MS);
      return;
    }

    window.adBreak({
      type: 'reward',
      name,
      adDismissed: () => { /* no reward on skip */ },
      adViewed: () => {
        this.onRewardedWatched();
        onComplete();
      },
    });
  }

  private shouldShowExitInterstitial(): boolean {
    const lastPurchase = parseInt(localStorage.getItem(LAST_PURCHASE_KEY) ?? '0', 10);
    if (Date.now() - lastPurchase < 24 * 60 * 60 * 1000) return false;

    const exits = parseInt(localStorage.getItem(INTERSTITIAL_EXITS_KEY) ?? '0', 10);
    return exits >= INTERSTITIAL_EVERY_N_EXITS;
  }

  private onExitInterstitialShown(): void {
    localStorage.setItem(INTERSTITIAL_EXITS_KEY, '0');
  }

  private shouldShowDeathInterstitial(): boolean {
    const lastPurchase = parseInt(localStorage.getItem(LAST_PURCHASE_KEY) ?? '0', 10);
    if (Date.now() - lastPurchase < 24 * 60 * 60 * 1000) return false;

    const deaths = parseInt(localStorage.getItem(DEATH_COUNT_KEY) ?? '0', 10);
    const sessionStart = parseInt(localStorage.getItem(SESSION_START_KEY) ?? '0', 10);
    // Use session start as baseline if no interstitial has been shown yet this session
    const lastIntTs = parseInt(localStorage.getItem(LAST_INT_TS_KEY) ?? '0', 10);
    const baseline = lastIntTs > sessionStart ? lastIntTs : sessionStart;
    const timeSince = baseline > 0 ? Date.now() - baseline : 0;

    return deaths >= DEATHS_PER_INTERSTITIAL || timeSince >= MIN_SESSION_MS_FOR_INTERSTITIAL;
  }

  private runDeathInterstitial(afterAd: () => void): void {
    localStorage.setItem(DEATH_COUNT_KEY, '0');
    localStorage.setItem(LAST_INT_TS_KEY, String(Date.now()));

    if (!window.adBreak) {
      console.info('[Ads] Death interstitial simulated (dev)');
      setTimeout(() => afterAd(), DEV_AD_DELAY_MS);
      return;
    }

    // adBreakDone is guaranteed by the H5 Ads API (fires on error, no-fill, dismiss, view).
    // afterAd fires on success only — both are wrapped by the caller's single-fire guard.
    window.adBreak({
      type: 'next',
      name: 'death_interstitial',
      afterAd: () => afterAd(),
      adBreakDone: () => afterAd(),
    });
  }

  incrementExitCount(): void {
    const exits = parseInt(localStorage.getItem(INTERSTITIAL_EXITS_KEY) ?? '0', 10);
    localStorage.setItem(INTERSTITIAL_EXITS_KEY, String(exits + 1));
  }
}
