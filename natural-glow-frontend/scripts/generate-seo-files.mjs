// Generates public/robots.txt and public/sitemap.xml before `vite build`.
// Set VITE_SITE_URL (e.g. https://www.example.com) in the build environment.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = (process.env.VITE_SITE_URL || process.env.SITE_URL || '').replace(/\/+$/, '');
const pages = ['/', '/about', '/services', '/pricing', '/gallery', '/contact'];

mkdirSync(resolve(root, 'public'), { recursive: true });

let robots = 'User-agent: *\nAllow: /\nDisallow: /admin\n';
if (site) robots += `\nSitemap: ${site}/sitemap.xml\n`;
writeFileSync(resolve(root, 'public/robots.txt'), robots);

if (site) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages
    .map((p) => `  <url><loc>${site}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n');
  writeFileSync(
    resolve(root, 'public/sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
  console.log(`SEO files written for ${site}`);
} else {
  console.warn('VITE_SITE_URL not set: wrote robots.txt only, skipped sitemap.xml');
}
