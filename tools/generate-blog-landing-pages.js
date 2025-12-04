'use strict';

const { readFile, writeFile, mkdir } = require('node:fs/promises');
const path = require('node:path');

const ROOT_DIR = path.normalize(path.resolve(__dirname, '..'));
const DATA_FILE = path.join(__dirname, 'blog-entries.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'blog');
const SITE_ORIGIN = 'https://hannesfahlin.se';

const readEntries = async () => {
  const raw = await readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('blog-entries.json must export an array');
  }
  return parsed;
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildHtml = (entry) => {
  const { slug, title, description, paths } = entry;
  if (!slug || !paths?.en || !paths?.sv) {
    throw new Error(`Entry ${JSON.stringify(entry)} is missing slug or paths`);
  }

  const enTitle = title?.en ?? 'Read this post in English';
  const enDescription = description?.en ?? 'Choose a language to keep reading.';
  const svDescription = description?.sv ?? 'Välj språk för att läsa vidare.';
  const shareTitle = `${enTitle} · Hannes Fahlin`;
  const shareText = enDescription;

  const canonicalUrl = `${SITE_ORIGIN}/blog/${slug}/`;
  const englishUrl = `${SITE_ORIGIN}/${paths.en}`;
  const swedishUrl = `${SITE_ORIGIN}/${paths.sv}`;

  const targets = {
    en: `/${paths.en}`,
    sv: `/${paths.sv}`,
  };

  const script = `(() => {
  const langKey = "hf-lang";
  const targets = ${JSON.stringify(targets)};
  const hasTarget = (value) => typeof value === 'string' && Object.prototype.hasOwnProperty.call(targets, value);

  let stored = null;
  try {
    stored = window.localStorage.getItem(langKey);
  } catch (error) {
    stored = null;
  }

  if (stored && hasTarget(stored)) {
    window.location.replace(targets[stored]);
    return;
  }

  const links = document.querySelectorAll('[data-choose-lang]');
  links.forEach((link) => {
    link.addEventListener('click', () => {
      const langCode = link.dataset.chooseLang;
      if (!hasTarget(langCode)) {
        return;
      }
      try {
        window.localStorage.setItem(langKey, langCode);
      } catch (error) {
        console.warn('Unable to persist language preference', error);
      }
    });
  });
})();`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(enDescription)}">
    <meta name="robots" content="noindex, follow">
    <link rel="canonical" href="${canonicalUrl}">
    <link rel="alternate" hreflang="en" href="${englishUrl}">
    <link rel="alternate" hreflang="sv" href="${swedishUrl}">
    <link rel="alternate" hreflang="x-default" href="${canonicalUrl}">
    <meta property="og:title" content="${escapeHtml(enTitle)} · Hannes Fahlin">
    <meta property="og:description" content="${escapeHtml(enDescription)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="Hannes Fahlin">
    <meta name="twitter:card" content="summary">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="stylesheet" href="../../styles/site.css">
    <script>
      (function () {
        try {
          var storedTheme = window.localStorage.getItem('hf-theme');
          if (storedTheme) {
            document.documentElement.dataset.theme = storedTheme;
          }
        } catch (error) {
          /* ignoring theme retrieval issues */
        }
      })();
    </script>
    <title>${escapeHtml(enTitle)} · Hannes Fahlin</title>
  </head>
  <body data-page="blog-landing">
    <main class="landing">
      <h1>${escapeHtml(enTitle)}</h1>
      <p>${escapeHtml(enDescription)}</p>
      <p>${escapeHtml(svDescription)}</p>
      <div class="language-choices">
        <a href="/${paths.en}" data-choose-lang="en">Read in English</a>
        <a href="/${paths.sv}" data-choose-lang="sv">Läs på svenska</a>
      </div>
      <div class="share-actions">
        <button
          type="button"
          class="button-ghost"
          data-share-url="/blog/${slug}/"
          data-share-title="${escapeHtml(shareTitle)}"
          data-share-text="${escapeHtml(shareText)}"
          data-share-copied-label="Link copied!"
        >Share</button>
      </div>
      <p class="note">We will remember your choice for next time. Vi sparar ditt språkval.</p>
    </main>
    <script>${script}</script>
    <script type="module" src="../../scripts/site.js"></script>
  </body>
</html>
`;
};

const main = async () => {
  const entries = await readEntries();
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const entry of entries) {
    const outputPath = path.join(OUTPUT_DIR, entry.slug, 'index.html');
    await mkdir(path.dirname(outputPath), { recursive: true });
    const html = buildHtml(entry);
    await writeFile(outputPath, html, 'utf8');
    console.info(`Generated ${outputPath}`);
  }
};

main().catch((error) => {
  console.error('Failed to generate blog landing pages:', error);
  process.exitCode = 1;
});
