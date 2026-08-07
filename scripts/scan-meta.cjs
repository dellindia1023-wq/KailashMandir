const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'https://kailashmahadev.in';

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, files=[]) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(full, files);
    } else if (e.isFile() && full.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function extractFirst(regex, content) {
  const m = regex.exec(content);
  return m ? m[1].trim() : '';
}

async function main() {
  const targets = [];
  if (await exists(path.join(process.cwd(), 'dist'))) targets.push(path.join(process.cwd(), 'dist'));
  if (await exists(path.join(process.cwd(), 'public'))) targets.push(path.join(process.cwd(), 'public'));

  const htmlFiles = new Set();
  for (const t of targets) {
    const files = await walk(t);
    files.forEach(f => htmlFiles.add(f));
  }

  const results = [];

  const robotsRe = /<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i;
  const canonicalRe = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i;
  const hreflangRe = /<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  const ogUrlRe = /<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i;
  const twitterUrlRe = /<meta[^>]*name=["']twitter:url["'][^>]*content=["']([^"']+)["'][^>]*>/i;

  for (const filePath of Array.from(htmlFiles).sort()) {
    const content = await fs.readFile(filePath, 'utf8');
    const robots = extractFirst(robotsRe, content);
    const canonical = extractFirst(canonicalRe, content);

    const hreflangs = [];
    let m;
    while ((m = hreflangRe.exec(content)) !== null) {
      hreflangs.push(`${m[1]}=>${m[2]}`);
    }

    const ogUrl = extractFirst(ogUrlRe, content) || '';
    const twitterUrl = extractFirst(twitterUrlRe, content) || '';

    results.push({ filePath, robots, canonical, hreflangs: hreflangs.join('; '), ogUrl, twitterUrl });
  }

  const canonMap = new Map();
  for (const r of results) {
    const c = r.canonical || '';
    if (!canonMap.has(c)) canonMap.set(c, []);
    canonMap.get(c).push(r.filePath);
  }

  for (const r of results) {
    const notes = [];
    if (r.robots && /noindex/i.test(r.robots)) notes.push('noindex');
    if (r.canonical && !r.canonical.startsWith(BASE_URL)) notes.push('canonical-not-base-url');
    if (!r.canonical) notes.push('missing-canonical');
    if (r.canonical && canonMap.get(r.canonical).length > 1) notes.push('duplicate-canonical');
    r.notes = notes.join('; ');
  }

  const csvLines = ['filePath,robots,canonical,hreflangs,og_url,twitter_url,notes'];
  for (const r of results) {
    const safe = (v) => '"' + (v || '').replace(/"/g, '""') + '"';
    csvLines.push([r.filePath, r.robots, r.canonical, r.hreflangs, r.ogUrl, r.twitterUrl, r.notes].map(safe).join(','));
  }
  await fs.writeFile(path.join(process.cwd(),'meta_report.csv'), csvLines.join('\n'), 'utf8');

  const md = ['| File | Robots | Canonical | Hreflangs | OG:url | Twitter:url | Notes |', '|---|---|---|---|---|---|---|'];
  for (const r of results) {
    md.push(`| ${path.relative(process.cwd(), r.filePath)} | ${r.robots || ''} | ${r.canonical || ''} | ${r.hreflangs || ''} | ${r.ogUrl || ''} | ${r.twitterUrl || ''} | ${r.notes || ''} |`);
  }
  await fs.writeFile(path.join(process.cwd(),'meta_report.md'), md.join('\n'), 'utf8');

  console.log('Scanned', results.length, 'HTML files. Reports written to meta_report.csv and meta_report.md');
}

main().catch(err => { console.error(err); process.exit(1); });
