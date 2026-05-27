import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ArenaSkinItem {
  slug: string;
  name: string;
  description: string;
  priceGems: number;
  sortOrder: number;
  owned: boolean;
  equipped: boolean;
}

const STORAGE_KEY = 'ast_arena_skin';
const DEFAULT_SLUG = 'default';

@Injectable({ providedIn: 'root' })
export class ArenaSkinService {
  private readonly http = inject(HttpClient);

  getActiveSlug(): string {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SLUG;
  }

  getFloorUrl(slug: string): string {
    if (slug === DEFAULT_SLUG) return 'assets/environment/bg-floor-tile.png';
    return `assets/environment/arenas/${slug}.png`;
  }

  list(): Observable<ArenaSkinItem[]> {
    return this.http.get<ArenaSkinItem[]>(`${environment.apiUrl}/arena-skins`);
  }

  purchase(slug: string): Observable<{ newGemBalance: number }> {
    return this.http.post<{ newGemBalance: number }>(
      `${environment.apiUrl}/arena-skins/${slug}/purchase`,
      {},
    );
  }

  equip(slug: string): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/arena-skins/equip`, { slug }).pipe(
      tap(() => localStorage.setItem(STORAGE_KEY, slug)),
    );
  }

  equipLocal(slug: string): void {
    localStorage.setItem(STORAGE_KEY, slug);
  }
}
