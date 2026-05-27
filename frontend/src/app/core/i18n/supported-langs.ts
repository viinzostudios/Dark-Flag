export interface LangMeta {
  code: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGS: LangMeta[] = [
  { code: 'es', nativeName: 'Español',   flag: '🇪🇸', dir: 'ltr' },
  { code: 'en', nativeName: 'English',   flag: '🇬🇧', dir: 'ltr' },
  { code: 'pt', nativeName: 'Português', flag: '🇧🇷', dir: 'ltr' },
  { code: 'fr', nativeName: 'Français',  flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', nativeName: 'Deutsch',   flag: '🇩🇪', dir: 'ltr' },
  { code: 'it', nativeName: 'Italiano',  flag: '🇮🇹', dir: 'ltr' },
  { code: 'ru', nativeName: 'Русский',   flag: '🇷🇺', dir: 'ltr' },
  { code: 'zh', nativeName: '中文',       flag: '🇨🇳', dir: 'ltr' },
  { code: 'ja', nativeName: '日本語',     flag: '🇯🇵', dir: 'ltr' },
  { code: 'ar', nativeName: 'العربية',   flag: '🇸🇦', dir: 'rtl' },
];

export const SUPPORTED_LANG_CODES = SUPPORTED_LANGS.map(l => l.code);

export const DEFAULT_LANG = 'en';
