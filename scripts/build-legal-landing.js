#!/usr/bin/env node
/**
 * Build script: convierte docs/06-monetizacion/legal/*.md a landing/*.html
 *
 * Uso:
 *   node scripts/build-legal-landing.js
 *
 * Requiere: npm install marked --no-save
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'docs', '06-monetizacion', 'legal');
const OUT = path.join(ROOT, 'landing');

const PAGES = [
  { md: 'privacy-policy.en.md',   html: 'privacy.html',     title: 'Privacy Policy — Bunkertank',         lang: 'en', altLang: 'es', altPath: '/privacy-es' },
  { md: 'privacy-policy.es.md',   html: 'privacy-es.html',  title: 'Política de Privacidad — Bunkertank', lang: 'es', altLang: 'en', altPath: '/privacy' },
  { md: 'terms-of-service.en.md', html: 'terms.html',       title: 'Terms of Service — Bunkertank',       lang: 'en', altLang: 'es', altPath: '/terms-es' },
  { md: 'terms-of-service.es.md', html: 'terms-es.html',    title: 'Términos de Servicio — Bunkertank',   lang: 'es', altLang: 'en', altPath: '/terms' },
  { md: 'refund-policy.en.md',    html: 'refunds.html',     title: 'Refund Policy — Bunkertank',          lang: 'en', altLang: 'es', altPath: '/refunds-es' },
  { md: 'refund-policy.es.md',    html: 'refunds-es.html',  title: 'Política de Reembolsos — Bunkertank', lang: 'es', altLang: 'en', altPath: '/refunds' },
  { md: 'cookies-policy.en.md',   html: 'cookies.html',     title: 'Cookies Policy — Bunkertank',         lang: 'en', altLang: 'es', altPath: '/cookies-es' },
  { md: 'cookies-policy.es.md',   html: 'cookies-es.html',  title: 'Política de Cookies — Bunkertank',    lang: 'es', altLang: 'en', altPath: '/cookies' },
];

const FOOTER_LINKS = {
  en: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms',   href: '/terms' },
    { label: 'Refunds', href: '/refunds' },
    { label: 'Cookies', href: '/cookies' },
  ],
  es: [
    { label: 'Privacidad',  href: '/privacy-es' },
    { label: 'Términos',    href: '/terms-es' },
    { label: 'Reembolsos',  href: '/refunds-es' },
    { label: 'Cookies',     href: '/cookies-es' },
  ],
};

function template({ title, lang, body, altLang, altPath }) {
  const langSwitcherLabel = altLang === 'es' ? 'Español' : 'English';
  const links = FOOTER_LINKS[lang].map(l => `<a href="${l.href}">${l.label}</a>`).join(' · ');
  const company = lang === 'es' ? 'VIINZO STUDIOS S.A.S. — NIT 901.787.694-7' : 'VIINZO STUDIOS S.A.S. — Tax ID 901.787.694-7';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <link rel="alternate" hreflang="${altLang}" href="${altPath}">
  <link rel="alternate" hreflang="${lang}" href="${PAGES.find(p => p.lang === lang && p.title === title).html.replace('.html', '') === 'privacy' || PAGES.find(p => p.lang === lang && p.title === title).html.replace('.html', '') === 'terms' || PAGES.find(p => p.lang === lang && p.title === title).html.replace('.html', '') === 'refunds' || PAGES.find(p => p.lang === lang && p.title === title).html.replace('.html', '') === 'cookies' ? '/' + PAGES.find(p => p.lang === lang && p.title === title).html.replace('.html', '') : '/' + PAGES.find(p => p.lang === lang && p.title === title).html.replace('.html', '')}">
  <title>${title}</title>
  <style>
    :root {
      --bg: #0f1419;
      --bg-card: #1a2028;
      --text: #e6e9ed;
      --text-muted: #9aa3ad;
      --accent: #ff8800;
      --border: #2a3038;
      --table-stripe: #1f262f;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
      font-size: 16px;
    }
    header {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      padding: 1rem 0;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .brand {
      font-weight: 700;
      font-size: 1.25rem;
      color: var(--text);
      text-decoration: none;
      letter-spacing: -0.02em;
    }
    .brand span { color: var(--accent); }
    .lang-switch {
      font-size: 0.875rem;
      color: var(--text-muted);
      text-decoration: none;
      padding: 0.4rem 0.8rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      transition: all 0.2s;
    }
    .lang-switch:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    main {
      padding: 2.5rem 0 4rem;
    }
    h1 {
      font-size: 2rem;
      margin: 0 0 1.5rem;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    h2 {
      font-size: 1.4rem;
      margin: 2.5rem 0 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      letter-spacing: -0.01em;
    }
    h3 {
      font-size: 1.15rem;
      margin: 1.75rem 0 0.75rem;
      color: var(--text);
    }
    p { margin: 0 0 1rem; }
    a { color: var(--accent); }
    a:hover { text-decoration: underline; }
    strong { color: var(--text); font-weight: 600; }
    code {
      background: var(--bg-card);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.9em;
      color: var(--accent);
      font-family: 'SF Mono', Monaco, Consolas, monospace;
    }
    ul, ol {
      margin: 0 0 1rem;
      padding-left: 1.5rem;
    }
    li { margin-bottom: 0.4rem; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.95rem;
    }
    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: var(--bg-card);
      font-weight: 600;
      color: var(--text);
    }
    tr:nth-child(even) td { background: var(--table-stripe); }
    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 2.5rem 0;
    }
    blockquote {
      border-left: 3px solid var(--accent);
      padding-left: 1rem;
      margin: 1rem 0;
      color: var(--text-muted);
    }
    footer {
      background: var(--bg-card);
      border-top: 1px solid var(--border);
      padding: 2rem 0;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    footer a {
      color: var(--text-muted);
      text-decoration: none;
      margin: 0 0.5rem;
    }
    footer a:hover { color: var(--accent); }
    .footer-company {
      margin-top: 1rem;
      font-size: 0.8rem;
      opacity: 0.7;
    }
    @media (max-width: 640px) {
      h1 { font-size: 1.6rem; }
      h2 { font-size: 1.25rem; }
      h3 { font-size: 1.05rem; }
      table { font-size: 0.85rem; }
      th, td { padding: 0.5rem 0.6rem; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container topbar">
      <a href="/" class="brand">Bunker<span>tank</span></a>
      <a href="${altPath}" class="lang-switch" hreflang="${altLang}">${langSwitcherLabel}</a>
    </div>
  </header>
  <main>
    <div class="container">
${body}
    </div>
  </main>
  <footer>
    <div class="container">
      <div>${links}</div>
      <div class="footer-company">${company}</div>
    </div>
  </footer>
</body>
</html>
`;
}

function build() {
  if (!fs.existsSync(OUT)) {
    fs.mkdirSync(OUT, { recursive: true });
  }

  for (const page of PAGES) {
    const mdPath = path.join(SRC, page.md);
    if (!fs.existsSync(mdPath)) {
      console.error(`Missing: ${mdPath}`);
      continue;
    }
    const md = fs.readFileSync(mdPath, 'utf8');
    const bodyHtml = marked.parse(md);
    const finalHtml = template({
      title: page.title,
      lang: page.lang,
      body: bodyHtml,
      altLang: page.altLang,
      altPath: page.altPath,
    });
    const outPath = path.join(OUT, page.html);
    fs.writeFileSync(outPath, finalHtml, 'utf8');
    console.log(`Built: landing/${page.html}`);
  }

  // Index simple que redirige a /privacy por defecto (sin landing comercial)
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/privacy">
  <link rel="canonical" href="/privacy">
  <title>Bunkertank</title>
</head>
<body>
  <p>Redirecting to <a href="/privacy">Bunkertank Privacy Policy</a>...</p>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml, 'utf8');
  console.log('Built: landing/index.html (redirect placeholder)');

  // Headers de seguridad para Cloudflare Pages
  const headers = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), camera=(), microphone=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
`;
  fs.writeFileSync(path.join(OUT, '_headers'), headers, 'utf8');
  console.log('Built: landing/_headers');

  console.log('\nDone. Upload the landing/ folder to Cloudflare Pages.');
}

build();
