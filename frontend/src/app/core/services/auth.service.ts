import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LanguageService } from './language.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPayload {
  sub: string;
  email: string;
  username: string;
}

const API_URL = environment.apiUrl;
const TOKEN_KEY = 'ast_access';
const REFRESH_KEY = 'ast_refresh';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // La sesión se considera activa mientras haya refresh token (dura 7 días).
  // El access token (1h) lo renueva automáticamente el interceptor en cada 401.
  private readonly _isLoggedIn = new BehaviorSubject<boolean>(this.hasRefreshToken());
  readonly isLoggedIn$ = this._isLoggedIn.asObservable();

  // Lazy inject to avoid circular dep (LanguageService → HttpClient)
  private readonly languageSvc = inject(LanguageService);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {
    // Sesión corrupta: access token presente pero sin refresh → limpiar
    if (this.hasAccessToken() && !this.hasRefreshToken()) {
      this.clearSession();
    }
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn.value;
  }

  /** Hay sesión potencialmente válida (refresh token presente). */
  hasActiveSession(): boolean {
    return this.hasRefreshToken();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  isAccessTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      return !payload.exp || Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  register(email: string, username: string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${API_URL}/auth/register`, { email, username, password }).pipe(
      tap(tokens => this.storeTokens(tokens)),
    );
  }

  login(email: string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${API_URL}/auth/login`, { email, password }).pipe(
      tap(tokens => {
        this.storeTokens(tokens);
        this.syncLangFromProfile();
      }),
    );
  }

  refresh(): Observable<AuthTokens> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    return this.http.post<AuthTokens>(`${API_URL}/auth/refresh`, { refreshToken }).pipe(
      tap(tokens => this.storeTokens(tokens)),
    );
  }

  /** Limpia la sesión local sin hacer llamada al servidor. */
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this._isLoggedIn.next(false);
  }

  logout(): void {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    this.http.post(`${API_URL}/auth/logout`, { refreshToken }).subscribe({ error: () => {} });
    this.clearSession();
    void this.router.navigate(['/auth/login']);
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    this._isLoggedIn.next(true);
  }

  private syncLangFromProfile(): void {
    this.http.get<{ preferredLang: string }>(`${API_URL}/users/me`).subscribe({
      next: ({ preferredLang }) => this.languageSvc.syncFromProfile(preferredLang),
      error: () => {},
    });
  }

  getCurrentUsername(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { username?: string };
      return payload.username ?? null;
    } catch {
      return null;
    }
  }

  private hasAccessToken(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  }

  private hasRefreshToken(): boolean {
    return Boolean(localStorage.getItem(REFRESH_KEY));
  }
}
