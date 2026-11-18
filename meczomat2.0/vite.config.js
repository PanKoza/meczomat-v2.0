import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { LEAGUE_STRUCTURE, leaguePath, getLeague } from './src/seo/shared.js'

// Strona główna jest serwowana jako statyczny index.html, więc wstawiamy do niej
// linki do wszystkich lig — robot znajdzie je bez uruchamiania JavaScriptu.
// Na podstronach api/page.js zastępuje ten blok treścią danej strony.
function seoHomeLinks() {
  return {
    name: 'seo-home-links',
    transformIndexHtml(html) {
      const sections = Object.entries(LEAGUE_STRUCTURE).map(([prov, levels]) => {
        const links = Object.values(levels).flat()
          .map(g => `<a href="${leaguePath(g.id)}">${getLeague(g.id).name}</a>`).join(', ');
        return `<p><strong>${prov}:</strong> ${links}</p>`;
      }).join('');
      const body = `<main class="ssr"><h1>Meczomat – wyniki niższych lig piłkarskich</h1>` +
        `<p>Tabele, wyniki i terminarze: IV liga, klasa okręgowa, A-klasa, B-klasa oraz Ekstraklasa, I, II i III liga.</p>` +
        `<nav aria-label="Rozgrywki"><p><a href="/rozgrywki">Wszystkie rozgrywki</a> · <a href="/centrum-kibica">Centrum Kibica</a></p>${sections}</nav></main>`;
      return html.replace('<!--ssr-outlet-->', `<!--ssr-->${body}<!--/ssr-->`);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), seoHomeLinks()],
})
