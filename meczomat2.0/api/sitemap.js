// Dynamiczna mapa strony: strony stałe, wszystkie ligi i wszystkie drużyny.
import { SITE_URL, LEAGUE_LIST, leaguePath, teamPath } from '../src/seo/shared.js';
import { getTeamIndex } from './_lib/render.js';

export default async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const index = await getTeamIndex();

  const urls = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/rozgrywki', changefreq: 'weekly', priority: '0.9' },
    { loc: '/centrum-kibica', changefreq: 'daily', priority: '0.6' },
    ...LEAGUE_LIST.map(l => ({ loc: leaguePath(l.id), changefreq: 'daily', priority: '0.9' })),
    ...(index ? index.list.map(t => ({ loc: teamPath(t.slug), changefreq: 'daily', priority: '0.8' })) : []),
  ];

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url><loc>${SITE_URL}${encodeURI(u.loc)}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n') +
    '\n</urlset>\n';

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', index ? 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' : 'public, max-age=0, s-maxage=120');
  res.end(xml);
}
