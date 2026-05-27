import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';
import { detectLanguage, saveLangPreference } from '../i18n/language-detector';
import { SUPPORTED_LANG_CODES, SUPPORTED_LANGS, type LangMeta } from '../i18n/supported-langs';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly http = inject(HttpClient);
  private readonly doc = inject(DOCUMENT);

  readonly currentLang = signal<string>('en');
  readonly langs: LangMeta[] = SUPPORTED_LANGS;

  init(): void {
    this.translate.addLangs(SUPPORTED_LANG_CODES);
    this.translate.setDefaultLang('en');

    const lang = detectLanguage();
    this.applyLang(lang);
  }

  /** Aplica el idioma guardado en el perfil del usuario autenticado. */
  syncFromProfile(preferredLang: string | null): void {
    if (preferredLang && SUPPORTED_LANG_CODES.includes(preferredLang)) {
      this.applyLang(preferredLang);
      saveLangPreference(preferredLang);
    }
  }

  /** Cambia el idioma manualmente. Persiste en localStorage y en BD si está autenticado. */
  setLang(code: string, isLoggedIn = false): void {
    if (!SUPPORTED_LANG_CODES.includes(code)) return;
    this.applyLang(code);
    saveLangPreference(code);
    if (isLoggedIn) {
      this.http.patch(`${API_URL}/users/me/language`, { lang: code }).subscribe();
    }
  }

  getLangMeta(code: string): LangMeta | undefined {
    return SUPPORTED_LANGS.find(l => l.code === code);
  }

  private applyLang(code: string): void {
    this.currentLang.set(code);
    this.translate.use(code);
    // RTL support
    const dir = SUPPORTED_LANGS.find(l => l.code === code)?.dir ?? 'ltr';
    this.doc.documentElement.setAttribute('dir', dir);
    this.doc.documentElement.setAttribute('lang', code);
  }
}
