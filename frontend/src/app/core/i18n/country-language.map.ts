/**
 * Mapa de código de país ISO-3166-1 alpha-2 → código de idioma.
 * Los países no listados aquí reciben inglés por defecto.
 * Editar este archivo para agregar nuevos países o cambiar asignaciones.
 */
export const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  // ── Español ────────────────────────────────────────────────────────
  MX: 'es', // México
  CO: 'es', // Colombia
  AR: 'es', // Argentina
  CL: 'es', // Chile
  PE: 'es', // Perú
  VE: 'es', // Venezuela
  EC: 'es', // Ecuador
  BO: 'es', // Bolivia
  PY: 'es', // Paraguay
  UY: 'es', // Uruguay
  CR: 'es', // Costa Rica
  PA: 'es', // Panamá
  GT: 'es', // Guatemala
  HN: 'es', // Honduras
  SV: 'es', // El Salvador
  NI: 'es', // Nicaragua
  DO: 'es', // República Dominicana
  PR: 'es', // Puerto Rico
  CU: 'es', // Cuba
  ES: 'es', // España

  // ── Portugués ──────────────────────────────────────────────────────
  BR: 'pt', // Brasil
  PT: 'pt', // Portugal
  AO: 'pt', // Angola
  MZ: 'pt', // Mozambique

  // ── Francés ────────────────────────────────────────────────────────
  FR: 'fr', // Francia
  BE: 'fr', // Bélgica
  CI: 'fr', // Costa de Marfil
  SN: 'fr', // Senegal
  CM: 'fr', // Camerún

  // ── Alemán ─────────────────────────────────────────────────────────
  DE: 'de', // Alemania
  AT: 'de', // Austria
  LI: 'de', // Liechtenstein

  // ── Italiano ───────────────────────────────────────────────────────
  IT: 'it', // Italia
  SM: 'it', // San Marino
  VA: 'it', // Ciudad del Vaticano

  // ── Ruso ───────────────────────────────────────────────────────────
  RU: 'ru', // Rusia
  BY: 'ru', // Bielorrusia
  KZ: 'ru', // Kazajistán
  KG: 'ru', // Kirguistán

  // ── Chino ──────────────────────────────────────────────────────────
  CN: 'zh', // China
  TW: 'zh', // Taiwán
  HK: 'zh', // Hong Kong
  SG: 'zh', // Singapur

  // ── Japonés ────────────────────────────────────────────────────────
  JP: 'ja', // Japón

  // ── Árabe ──────────────────────────────────────────────────────────
  SA: 'ar', // Arabia Saudita
  AE: 'ar', // Emiratos Árabes Unidos
  EG: 'ar', // Egipto
  MA: 'ar', // Marruecos
  DZ: 'ar', // Argelia
  IQ: 'ar', // Irak
  JO: 'ar', // Jordania
  LB: 'ar', // Líbano
  SY: 'ar', // Siria

  // ── Suiza: alemán por defecto (puede cambiarse a 'fr' o 'it') ──────
  CH: 'de',
};
