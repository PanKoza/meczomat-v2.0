// Renderuje HTML podstron (ligi, drużyny, listy rozgrywek) z treścią i meta tagami dla Google.
// Trasy mapowane są w vercel.json, np. /druzyna/:slug → /api/page?route=team&slug=:slug
import { renderRoute } from './_lib/render.js';

export default async function handler(req, res) {
  const { route = 'notfound', id, slug } = req.query;
  try {
    const { status, html, cacheControl } = await renderRoute(req, String(route), { id: String(id || ''), slug: String(slug || '') });
    res.statusCode = status;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', cacheControl);
    if (status === 503) res.setHeader('Retry-After', '600');
    res.end(html);
  } catch (err) {
    console.error('SSR error:', err);
    res.statusCode = 500;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Awaryjnie odsyłamy na stronę główną aplikacji, żeby użytkownik nie utknął na błędzie
    res.end('<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><script>location.replace("/")</script>');
  }
}
