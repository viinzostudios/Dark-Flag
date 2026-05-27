import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AvatarItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  priceCoins: number;
  sortOrder: number;
  owned: boolean;
  equipped: boolean;
}

const STORAGE_KEY = 'ast_avatar_slug';
const DEFAULT_SLUG = 'avatar-01';

@Injectable({ providedIn: 'root' })
export class AvatarsService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/avatars`;

  getActiveSlug(): string {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SLUG;
  }

  getAvatarUrl(slug: string): string {
    return `assets/avatars/${slug}.png`;
  }

  list(category?: string): Observable<AvatarItem[]> {
    const params = category ? `?category=${category}` : '';
    return this.http.get<AvatarItem[]>(`${this.api}${params}`);
  }

  purchase(slug: string): Observable<void> {
    return this.http.post<void>(`${this.api}/${slug}/purchase`, {});
  }

  equip(slug: string): Observable<void> {
    return this.http.put<void>(`${this.api}/equip`, { slug }).pipe(
      tap(() => localStorage.setItem(STORAGE_KEY, slug)),
    );
  }

  equipLocal(slug: string): void {
    localStorage.setItem(STORAGE_KEY, slug);
  }
}
