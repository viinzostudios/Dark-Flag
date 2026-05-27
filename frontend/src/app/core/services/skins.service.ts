import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Skin {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  bodyColor: string;
  cannonColor: string;
  price: number;
  gemPrice: number;
  matchesUnlock: number;
  speedBonus: number;
  hpBonus: number;
  ammoBonus: number;
  wallBonus: number;
  bulletSpeedBonus: number;
  xpMultiplier: number;
  coinMultiplier: number;
  sortOrder: number;
  owned?: boolean;
  equipped?: boolean;
  claimable?: boolean;
}

export interface SkinProgression {
  gamesPlayed: number;
  nextFreeSkin: {
    id: string;
    name: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    bodyColor: string;
    cannonColor: string;
    matchesUnlock: number;
    progressPercent: number;
  } | null;
  claimableSkins: Array<{
    id: string;
    name: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    bodyColor: string;
    cannonColor: string;
  }>;
}

export interface CoinPackage {
  id: string;
  coins: number;
  premiumCoins: number;
  amountCents: number;
  label: string;
}

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class SkinsService {
  constructor(private readonly http: HttpClient) {}

  getSkins(rarity?: string): Observable<Skin[]> {
    const params = rarity ? `?rarity=${rarity}` : '';
    return this.http.get<Skin[]>(`${API}/skins${params}`);
  }

  getMySkins(): Observable<Skin[]> {
    return this.http.get<Skin[]>(`${API}/skins/user/me`);
  }

  getProgression(): Observable<SkinProgression> {
    return this.http.get<SkinProgression>(`${API}/skins/user/progression`);
  }

  purchase(skinId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API}/skins/${skinId}/purchase`, {});
  }

  purchaseWithGems(skinId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API}/skins/${skinId}/purchase-gems`, {});
  }

  claimFree(skinId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API}/skins/${skinId}/claim-free`, {});
  }

  equip(skinId: string): Observable<{ activeSkinId: string }> {
    return this.http.put<{ activeSkinId: string }>(`${API}/skins/${skinId}/equip`, {});
  }

  unequip(): Observable<void> {
    return this.http.delete<void>(`${API}/skins/user/me/active-skin`);
  }

  getPackages(): Observable<CoinPackage[]> {
    return this.http.get<CoinPackage[]>(`${API}/shop/packages`);
  }

  createPaymentIntent(packageId: string): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(`${API}/shop/purchase/intent`, { packageId });
  }

  /** Rarity display label */
  rarityLabel(rarity: string): string {
    const map: Record<string, string> = {
      common: 'Común',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Legendario',
    };
    return map[rarity] ?? rarity;
  }

  /** Builds a short bonus summary string, e.g. "+10% vel  +2 HP" */
  bonusSummary(skin: Skin): string {
    const parts: string[] = [];
    if (skin.speedBonus)        parts.push(`+${skin.speedBonus}% vel`);
    if (skin.hpBonus)           parts.push(`+${skin.hpBonus} HP`);
    if (skin.ammoBonus)         parts.push(`+${skin.ammoBonus} balas`);
    if (skin.wallBonus)         parts.push(`+${skin.wallBonus} muros`);
    if (skin.bulletSpeedBonus)  parts.push(`+${skin.bulletSpeedBonus}% proj`);
    if (skin.xpMultiplier)      parts.push(`+${skin.xpMultiplier}% XP`);
    if (skin.coinMultiplier)    parts.push(`+${skin.coinMultiplier}% coins`);
    return parts.join('  ');
  }
}
