import { COUNTRY_LANGUAGE_MAP } from './country-language.map';
import { DEFAULT_LANG, SUPPORTED_LANG_CODES } from './supported-langs';

const STORAGE_KEY = 'ast_lang';

/**
 * Determina el idioma activo al iniciar la app.
 * Orden de prioridad:
 *   1. Preferencia guardada en localStorage (usuario eligió manualmente)
 *   2. navigator.language → extraer código de país → COUNTRY_LANGUAGE_MAP
 *   3. navigator.language → extraer código de idioma base
 *   4. Fallback a inglés
 */
export function detectLanguage(): string {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED_LANG_CODES.includes(saved)) return saved;

  const locale = navigator.language || navigator.languages?.[0] || DEFAULT_LANG;
  const parts = locale.split('-');

  if (parts.length > 1) {
    const countryCode = parts[1].toUpperCase();
    const mapped = COUNTRY_LANGUAGE_MAP[countryCode];
    if (mapped && SUPPORTED_LANG_CODES.includes(mapped)) return mapped;
  }

  const langCode = parts[0].toLowerCase();
  if (SUPPORTED_LANG_CODES.includes(langCode)) return langCode;

  return DEFAULT_LANG;
}

export function saveLangPreference(code: string): void {
  localStorage.setItem(STORAGE_KEY, code);
}

export function clearLangPreference(): void {
  localStorage.removeItem(STORAGE_KEY);
}
