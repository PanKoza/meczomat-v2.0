/* global process */
// Generowanie HTML podstron dla wyszukiwarek (i pierwszego wyświetlenia dla ludzi).
// Bierzemy zbudowany index.html aplikacji, podmieniamy meta tagi, dokładamy JSON-LD
// i wstawiamy do #root treść strony. React po załadowaniu i tak renderuje własny widok.
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  SITE_URL, SITE_NAME, SEASON_LABEL, LEAGUE_LIST, LEAGUE_STRUCTURE, getLeague, leaguePath, teamPath,
  leagueFullName, buildTeamIndex, teamSlugFor, splitMatches, splitTeamMatches, matchResultFor,
  leagueMeta, teamMeta, leaguesIndexMeta, newsMeta,
} from '../../src/seo/shared.js';

export const API_URL = (process.env.API_URL || process.env.VITE_API_URL || 'https://meczomat-api.onrender.com').replace(/\/$/, '');

// --- POBIERANIE DANYCH ---
export async function getJSON(p, ms = 7000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(API_URL + p, { signal: ctl.signal });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Indeks drużyn trzymamy w pamięci ciepłej instancji funkcji przez 10 min
let teamCache = { at: 0, index: null };
export async function getTeamIndex() {
  if (teamCache.index && Date.now() - teamCache.at < 10 * 60 * 1000) return teamCache.index;
  let teams = await getJSON('/api/druzyny', 8000);
  if (!Array.isArray(teams) || teams.length === 0) {
    // Awaryjnie (starsza wersja API) składamy listę z tabel wszystkich lig
    const tables = await Promise.all(LEAGUE_LIST.map(l => getJSON(`/api/tabela?liga=${encodeURIComponent(l.id)}`, 6000)));
    teams = [];
    tables.forEach((t, i) => Array.isArray(t) && t.forEach(r => teams.push({ name: r.nazwa, leagueId: LEAGUE_LIST[i].id })));
  }
  if (teams.length === 0) return teamCache.index; // stary indeks lepszy niż żaden
  teamCache = { at: Date.now(), index: buildTeamIndex(teams) };
  return teamCache.index;
}

let templateCache = null;
async function getTemplate(req) {
  if (templateCache) return templateCache;
  for (const p of [path.join(process.cwd(), 'dist', 'index.html'), path.join(process.cwd(), 'index.html')]) {
    try {
      const html = await fs.readFile(p, 'utf8');
      // index.html ze źródeł (bez zbudowanych assetów) nie nadaje się do serwowania
      if (html.includes('/assets/')) return (templateCache = html);
    } catch { /* próbujemy dalej */ }
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const r = await fetch(`https://${host}/index.html`);
  if (!r.ok) throw new Error(`Nie udało się pobrać szablonu index.html (${r.status})`);
  return (templateCache = await r.text());
}

// --- POMOCNICZE ---
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jsonScript = obj => JSON.stringify(obj).replace(/</g, '\\u003c');
const abs = p => SITE_URL + p;

function replaceMeta(html, keyAttr, keyVal, value) {
  const re = new RegExp(`(<meta\\s+${keyAttr}="${keyVal}"\\s+content=")[^"]*(")`);
  return html.replace(re, `$1${esc(value)}$2`);
}

function breadcrumbLd(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

function breadcrumbHtml(items) {
  return `<nav class="ssr-crumbs" aria-label="Okruszki">${items.map((it, i) =>
    i === items.length - 1 ? `<span>${esc(it.name)}</span>` : `<a href="${esc(it.path)}">${esc(it.name)}</a>`
  ).join(' › ')}</nav>`;
}

function applyPage(template, { meta, robots, jsonLd, body, ssrData }) {
  let html = template;
  const url = abs(meta.path);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`);
  html = replaceMeta(html, 'name', 'description', meta.description);
  html = replaceMeta(html, 'property', 'og:title', meta.title);
  html = replaceMeta(html, 'property', 'og:description', meta.description);
  html = replaceMeta(html, 'property', 'og:url', url);
  html = replaceMeta(html, 'name', 'twitter:title', meta.title);
  html = replaceMeta(html, 'name', 'twitter:description', meta.description);
  if (robots) html = replaceMeta(html, 'name', 'robots', robots);
  html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${url}$2`);
  // Dane strukturalne strony głównej nie pasują do podstron
  html = html.replace(/<!--\s*home-only\s*-->[\s\S]*?<!--\s*\/home-only\s*-->/g, '');

  const head = [
    jsonLd ? `<script type="application/ld+json" data-ssr>${jsonScript({ '@context': 'https://schema.org', '@graph': jsonLd })}</script>` : '',
    ssrData ? `<script>window.__SSR__=${jsonScript(ssrData)}</script>` : '',
  ].join('\n');
  html = html.replace('</head>', `${head}\n</head>`);
  html = html.replace(/<!--ssr-->[\s\S]*?<!--\/ssr-->|<!--ssr-outlet-->/, `<!--ssr-->${body || ''}<!--/ssr-->`);
  return html;
}

function tableHtml(tabela, leagueId, index, highlight) {
  const rows = tabela.map(r => {
    const slug = teamSlugFor(index, r.nazwa, leagueId);
    return `<tr${r.nazwa === highlight ? ' class="me"' : ''}><td class="n">${esc(r.pozycja)}.</td>` +
      `<td><a href="${teamPath(slug)}">${esc(r.nazwa)}</a></td><td class="n">${esc(r.mecze)}</td>` +
      `<td class="n"><strong>${esc(r.punkty)}</strong></td><td class="n">${esc(r.zwyciestwa)}-${esc(r.remisy)}-${esc(r.porazki)}</td>` +
      `<td class="n">${esc(r.bramkiStrzelone)}:${esc(r.bramkiStracone)}</td></tr>`;
  }).join('');
  return `<table><thead><tr><th class="n">Lp.</th><th>Drużyna</th><th class="n">M</th><th class="n">Pkt</th><th class="n">Z-R-P</th><th class="n">Bramki</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function matchesHtml(list, leagueId, index, played) {
  if (!list.length) return '<p class="muted">Brak meczów.</p>';
  const link = name => `<a href="${teamPath(teamSlugFor(index, name, leagueId))}">${esc(name)}</a>`;
  return `<ul>${list.map(m =>
    `<li><span class="muted">${esc(m.dataWizualna)}${m.godzina && m.godzina !== '--:--' ? `, ${esc(m.godzina)}` : ''} · kolejka ${esc(m.kolejka)}</span><br>` +
    `${link(m.gospodarz.nazwa)} <strong>${played ? `${esc(m.wynikGospodarz)}:${esc(m.wynikGosc)}` : '–'}</strong> ${link(m.gosc.nazwa)}</li>`
  ).join('')}</ul>`;
}

const crumbsBase = [{ name: 'Strona główna', path: '/' }, { name: 'Rozgrywki', path: '/rozgrywki' }];

// --- STRONY ---
async function leaguePage(id) {
  const league = getLeague(id);
  if (!league) return null;
  const [tabela, mecze, index] = await Promise.all([getJSON(`/api/tabela?liga=${encodeURIComponent(id)}`), getJSON(`/api/mecze?liga=${encodeURIComponent(id)}`), getTeamIndex()]);
  const t = Array.isArray(tabela) ? tabela : [];
  const m = Array.isArray(mecze) ? mecze : [];
  const meta = leagueMeta(league, t);
  const { played, upcoming } = splitMatches(m);
  const crumbs = [...crumbsBase, { name: league.name, path: leaguePath(id) }];
  const siblings = LEAGUE_STRUCTURE[league.province][league.level].filter(g => g.id !== id);
  const full = leagueFullName(league);
  const leader = t[0];
  const lastRound = played[0]?.kolejka;

  const body = `<main class="ssr">${breadcrumbHtml(crumbs)}
<h1>${esc(full)} – tabela i wyniki ${SEASON_LABEL}</h1>
<p>Aktualna tabela, wyniki i terminarz – ${esc(league.name)}, sezon ${SEASON_LABEL}${league.province !== 'Cała Polska' ? ` (województwo ${esc(league.province.toLowerCase())})` : ''}.` +
    `${t.length ? ` W lidze gra ${t.length} drużyn.` : ''}${leader ? ` Liderem jest <a href="${teamPath(teamSlugFor(index, leader.nazwa, id))}">${esc(leader.nazwa)}</a> z dorobkiem ${esc(leader.punkty)} pkt.` : ''}` +
    `${lastRound ? ` Ostatnio rozegrana kolejka: ${esc(lastRound)}.` : ''}</p>
${t.length ? `<h2>Tabela – ${esc(league.name)}</h2>${tableHtml(t, id, index)}` : ''}
<h2>Ostatnie wyniki</h2>${matchesHtml(played.slice(0, 16), id, index, true)}
<h2>Najbliższe mecze</h2>${matchesHtml(upcoming.slice(0, 16), id, index, false)}
${siblings.length ? `<h2>Inne grupy – ${esc(league.level)}</h2><ul>${siblings.map(s => `<li><a href="${leaguePath(s.id)}">${esc(getLeague(s.id).name)}</a></li>`).join('')}</ul>` : ''}
</main>`;

  const jsonLd = [
    { '@type': 'WebPage', '@id': abs(meta.path), url: abs(meta.path), name: meta.title, description: meta.description, inLanguage: 'pl', isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL + '/' } },
    breadcrumbLd(crumbs),
    {
      '@type': 'SportsOrganization', name: league.name, sport: 'Piłka nożna', url: abs(meta.path),
      ...(league.province !== 'Cała Polska' ? { areaServed: { '@type': 'AdministrativeArea', name: `województwo ${league.province.toLowerCase()}` } } : {}),
      member: t.map(r => ({ '@type': 'SportsTeam', name: r.nazwa, url: abs(teamPath(teamSlugFor(index, r.nazwa, id))) })),
    },
  ];
  return {
    meta, body, jsonLd,
    ssrData: t.length ? { path: meta.path, league: { id, tabela: t, mecze: m } } : null,
    cache: t.length ? 'long' : 'short',
  };
}

async function teamPage(slug) {
  const [index, fb] = await Promise.all([getTeamIndex(), getJSON('/api/club-facebook', 4000)]);
  if (!index) return { unavailable: true };
  const team = index.bySlug[slug];
  if (!team) return null;
  const league = getLeague(team.leagueId);
  if (!league) return null;
  const [tabela, mecze] = await Promise.all([getJSON(`/api/tabela?liga=${encodeURIComponent(team.leagueId)}`), getJSON(`/api/mecze?liga=${encodeURIComponent(team.leagueId)}`)]);
  const t = Array.isArray(tabela) ? tabela : [];
  const m = Array.isArray(mecze) ? mecze : [];
  const row = t.find(r => r.nazwa === team.name);
  const { played, upcoming } = splitTeamMatches(m, team.name);
  const meta = teamMeta(team, league, row, played, upcoming);
  const crumbs = [...crumbsBase, { name: league.name, path: leaguePath(league.id) }, { name: team.name, path: meta.path }];
  const form = played.slice(0, 5).map(x => matchResultFor(x, team.name));
  const lower = team.name.toLowerCase();
  const fbClub = Array.isArray(fb) ? (fb.find(c => c.clubName?.toLowerCase() === lower) || fb.find(c => c.clubName && lower.includes(c.clubName.toLowerCase()))) : null;
  const next = upcoming[0];
  const others = t.filter(r => r.nazwa !== team.name);

  const summary = [
    `<strong>${esc(team.name)}</strong> – liga: <a href="${leaguePath(league.id)}">${esc(league.name)}</a>${league.province !== 'Cała Polska' ? ` (${esc(league.province.toLowerCase())})` : ''}, sezon ${SEASON_LABEL}.`,
    row ? `Po ${esc(row.mecze)} ${String(row.mecze) === '1' ? 'meczu' : 'meczach'}: <strong>${esc(row.pozycja)}. miejsce</strong> w tabeli, ${esc(row.punkty)} pkt, bilans zwycięstw, remisów i porażek ${esc(row.zwyciestwa)}-${esc(row.remisy)}-${esc(row.porazki)}, bramki ${esc(row.bramkiStrzelone)}:${esc(row.bramkiStracone)}.` : '',
    form.length ? `Forma w ostatnich meczach: ${form.join(' ')}.` : '',
    played[0] ? `Ostatni wynik: ${esc(played[0].gospodarz.nazwa)} ${esc(played[0].wynikGospodarz)}:${esc(played[0].wynikGosc)} ${esc(played[0].gosc.nazwa)} (${esc(played[0].dataWizualna)}).` : '',
    next ? `Następny mecz: ${esc(next.gospodarz.nazwa)} – ${esc(next.gosc.nazwa)}${next.dataWizualna ? `, ${esc(next.dataWizualna)}` : ''}${next.dataWizualna && next.godzina && next.godzina !== '--:--' ? ` o ${esc(next.godzina)}` : ''}.` : '',
  ].filter(Boolean).join(' ');

  const body = `<main class="ssr">${breadcrumbHtml(crumbs)}
<h1>${esc(team.name)} – wyniki, terminarz i tabela</h1>
<p>${summary}</p>
<h2>Wyniki meczów – ${esc(team.name)}</h2>${matchesHtml(played, league.id, index, true)}
<h2>Terminarz – ${esc(team.name)}</h2>${matchesHtml(upcoming, league.id, index, false)}
${t.length ? `<h2>Tabela – ${esc(league.name)}</h2>${tableHtml(t, league.id, index, team.name)}` : ''}
${fbClub ? `<h2>${esc(team.name)} na Facebooku</h2><p><a href="${esc(fbClub.facebookUrl)}" rel="noopener" target="_blank">Oficjalna strona klubu na Facebooku</a></p>` : ''}
${others.length ? `<h2>Pozostałe drużyny – ${esc(league.name)}</h2><ul>${others.map(r => `<li><a href="${teamPath(teamSlugFor(index, r.nazwa, league.id))}">${esc(r.nazwa)}</a></li>`).join('')}</ul>` : ''}
</main>`;

  const teamUrl = abs(meta.path);
  const jsonLd = [
    { '@type': 'WebPage', '@id': teamUrl, url: teamUrl, name: meta.title, description: meta.description, inLanguage: 'pl', about: { '@id': `${teamUrl}#druzyna` }, isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL + '/' } },
    breadcrumbLd(crumbs),
    {
      '@type': 'SportsTeam', '@id': `${teamUrl}#druzyna`, name: team.name, sport: 'Piłka nożna', url: teamUrl,
      memberOf: { '@type': 'SportsOrganization', name: league.name, url: abs(leaguePath(league.id)) },
      ...(fbClub ? { sameAs: [fbClub.facebookUrl] } : {}),
    },
  ];
  return {
    meta, body, jsonLd,
    ssrData: { path: meta.path, team: { slug, name: team.name, leagueId: league.id }, ...(t.length ? { league: { id: league.id, tabela: t, mecze: m } } : {}) },
    cache: t.length ? 'long' : 'short',
  };
}

function leaguesIndexPage() {
  const meta = leaguesIndexMeta();
  const sections = Object.keys(LEAGUE_STRUCTURE).map(prov => {
    const levels = Object.keys(LEAGUE_STRUCTURE[prov]).filter(l => LEAGUE_STRUCTURE[prov][l].length);
    return `<h2>${esc(prov)}</h2>` + levels.map(l =>
      `<p><strong>${esc(l)}:</strong> ${LEAGUE_STRUCTURE[prov][l].map(g => `<a href="${leaguePath(g.id)}">${esc(getLeague(g.id).name)}</a>`).join(', ')}</p>`
    ).join('');
  }).join('');
  const crumbs = crumbsBase;
  return {
    meta,
    body: `<main class="ssr">${breadcrumbHtml(crumbs)}<h1>Rozgrywki piłkarskie – tabele i wyniki ${SEASON_LABEL}</h1><p>Wybierz ligę, aby zobaczyć aktualną tabelę, wyniki i terminarz meczów.</p>${sections}</main>`,
    jsonLd: [
      { '@type': 'CollectionPage', url: abs(meta.path), name: meta.title, description: meta.description, inLanguage: 'pl' },
      breadcrumbLd(crumbs),
      { '@type': 'ItemList', itemListElement: LEAGUE_LIST.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: l.name, url: abs(leaguePath(l.id)) })) },
    ],
    cache: 'long',
  };
}

// --- GŁÓWNA FUNKCJA ---
const CACHE = {
  long: 'public, max-age=0, s-maxage=900, stale-while-revalidate=86400',
  short: 'public, max-age=0, s-maxage=60, stale-while-revalidate=600',
};

export async function renderRoute(req, route, params) {
  const template = await getTemplate(req);
  let page = null;
  let status = 200;

  if (route === 'league') page = await leaguePage(params.id);
  else if (route === 'team') page = await teamPage(params.slug);
  else if (route === 'leagues') page = leaguesIndexPage();
  else if (route === 'news') page = { meta: newsMeta(), cache: 'long' };
  else if (route === 'cms') page = { meta: { title: 'Panel administracyjny | Meczomat', description: '', path: '/cms' }, robots: 'noindex, nofollow', cache: 'long' };

  if (page?.unavailable) {
    // API chwilowo niedostępne — mówimy robotom, żeby wróciły później, zamiast indeksować pustą stronę
    status = 503;
    page = { meta: { title: 'Meczomat', description: '', path: '/' }, robots: 'noindex', cache: 'none' };
  } else if (!page) {
    status = 404;
    page = {
      meta: { title: 'Nie znaleziono strony | Meczomat', description: '', path: '/' },
      robots: 'noindex, follow',
      body: `<main class="ssr"><h1>Nie znaleziono strony</h1><p><a href="/rozgrywki">Przejdź do listy rozgrywek</a></p></main>`,
      cache: 'short',
    };
  }

  return {
    status,
    html: applyPage(template, page),
    cacheControl: page.cache === 'none' ? 'no-store' : CACHE[page.cache] || CACHE.short,
  };
}
