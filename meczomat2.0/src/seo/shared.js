// Wspólne dane i logika SEO — używane zarówno przez aplikację React (src/),
// jak i przez funkcje serwerowe Vercela (api/), które generują HTML dla Google.
// Czysty JS bez zależności, żeby dało się go importować w obu środowiskach.

export const SITE_URL = 'https://meczomat.pl';
export const SITE_NAME = 'Meczomat';
export const SEASON_START_YEAR = 2026;
export const SEASON_LABEL = `${SEASON_START_YEAR}/${String(SEASON_START_YEAR + 1).slice(2)}`; // "2026/27"

// --- STRUKTURA LIG ---
export const LEAGUE_STRUCTURE = {
  "Cała Polska": {
    "Ekstraklasa": [{ id: "ekstraklasa", name: "PKO BP Ekstraklasa" }],
    "I Liga": [{ id: "1-liga", name: "Betclic 1. Liga" }],
    "II Liga": [{ id: "2-liga", name: "Betclic 2. Liga" }],
    "III Liga": [
      { id: "3-liga-gr1", name: "Grupa I" }, { id: "3-liga-gr2", name: "Grupa II" },
      { id: "3-liga-gr3", name: "Grupa III" }, { id: "3-liga-gr4", name: "Grupa IV" }
    ]
  },
  "Dolnośląskie": {
    "IV Liga": [{ id: "iv-liga", name: "IV Liga Dolnośląska" }],
    "V Liga": [],
    "Klasa Okręgowa": [
      { id: "okregowka-Wroclaw", name: "Grupa Wrocław" },
      { id: "okregowka-Legnica", name: "Grupa Legnica" },
      { id: "okregowka-Jelenia-Gora", name: "Grupa Jelenia Góra" },
      { id: "okregowka-Walbrzych", name: "Grupa Wałbrzych" }
    ],
    "A-Klasa": [
      { id: "Decathlon-Klasa-A-Wroclaw-I",      name: "Wrocław I" },
      { id: "Decathlon-Klasa-A-Wroclaw-II",     name: "Wrocław II" },
      { id: "Decathlon-Klasa-A-Wroclaw-III",    name: "Wrocław III" },
      { id: "Decathlon-Klasa-A-Wroclaw-IV",     name: "Wrocław IV" },
      { id: "Decathlon-Klasa-A-Legnica-I",      name: "Legnica I" },
      { id: "Decathlon-Klasa-A-Legnica-II",     name: "Legnica II" },
      { id: "Decathlon-Klasa-A-Legnica-III",    name: "Legnica III" },
      { id: "Decathlon-Klasa-A-Walbrzych-I",    name: "Wałbrzych I" },
      { id: "Decathlon-Klasa-A-Walbrzych-II",   name: "Wałbrzych II" },
      { id: "Decathlon-Klasa-A-Walbrzych-III",  name: "Wałbrzych III" },
      { id: "Decathlon-Klasa-A-Jelenia-Gora-I", name: "Jelenia Góra I" },
      { id: "Decathlon-Klasa-A-Jelenia-Gora-II",name: "Jelenia Góra II" },
      { id: "Decathlon-Klasa-A-Jelenia-Gora-III",name: "Jelenia Góra III" }
    ],
    "B-Klasa": [
      { id: "Klasa-B-Wroclaw-I",       name: "Wrocław I" },
      { id: "Klasa-B-Wroclaw-II",      name: "Wrocław II" },
      { id: "Klasa-B-Wroclaw-III",     name: "Wrocław III" },
      { id: "Klasa-B-Wroclaw-IV",      name: "Wrocław IV" },
      { id: "Klasa-B-Wroclaw-V",       name: "Wrocław V" },
      { id: "Klasa-B-Wroclaw-VI",      name: "Wrocław VI" },
      { id: "Klasa-B-Wroclaw-VII",     name: "Wrocław VII" },
      { id: "Klasa-B-Wroclaw-VIII",    name: "Wrocław VIII" },
      { id: "Klasa-B-Legnica-I",       name: "Legnica I" },
      { id: "Klasa-B-Legnica-II",      name: "Legnica II" },
      { id: "Klasa-B-Legnica-III",     name: "Legnica III" },
      { id: "Klasa-B-Legnica-IV",      name: "Legnica IV" },
      { id: "Klasa-B-Legnica-V",       name: "Legnica V" },
      { id: "Klasa-B-Walbrzych-I",     name: "Wałbrzych I" },
      { id: "Klasa-B-Walbrzych-II",    name: "Wałbrzych II" },
      { id: "Klasa-B-Walbrzych-III",   name: "Wałbrzych III" },
      { id: "Klasa-B-Walbrzych-IV",    name: "Wałbrzych IV" },
      { id: "Klasa-B-Walbrzych-V",     name: "Wałbrzych V" },
      { id: "Klasa-B-Jelenia-Gora-I",  name: "Jelenia Góra I" },
      { id: "Klasa-B-Jelenia-Gora-II", name: "Jelenia Góra II" },
      { id: "Klasa-B-Jelenia-Gora-III",name: "Jelenia Góra III" },
      { id: "Klasa-B-Jelenia-Gora-IV", name: "Jelenia Góra IV" },
      { id: "Klasa-B-Jelenia-Gora-V",  name: "Jelenia Góra V" }
    ]
  }
};

function displayName(level, group, groupCount) {
  if (groupCount === 1) return group.name;
  if (level === 'III Liga') return `III Liga – ${group.name}`;
  return `${level} ${group.name.replace(/^Grupa /, '')}`;
}

// id ligi → { id, name (pełna, czytelna nazwa), groupName, level, province }
export const LEAGUE_INDEX = {};
export const LEAGUE_LIST = [];
for (const province of Object.keys(LEAGUE_STRUCTURE)) {
  for (const level of Object.keys(LEAGUE_STRUCTURE[province])) {
    const groups = LEAGUE_STRUCTURE[province][level];
    for (const group of groups) {
      const meta = { id: group.id, name: displayName(level, group, groups.length), groupName: group.name, level, province };
      LEAGUE_INDEX[group.id] = meta;
      LEAGUE_LIST.push(meta);
    }
  }
}

export const getLeague = id => LEAGUE_INDEX[id] || null;
export const leaguePath = id => `/rozgrywki/${id}`;
export const teamPath = slug => `/druzyna/${slug}`;

// "Nazwa ligi (dolnośląskie)" dla lig regionalnych — region w tytule pomaga w lokalnych wyszukiwaniach
export function leagueFullName(league) {
  if (!league) return '';
  return league.province === 'Cała Polska' ? league.name : `${league.name} (${league.province.toLowerCase()})`;
}

// --- SLUGI DRUŻYN ---
const PL_CHARS = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, c => PL_CHARS[c])
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Z listy [{ name, leagueId }] (kolejność jak z /api/druzyny) budujemy indeks ze slugami.
// Slug to sama nazwa klubu — dzięki temu adres nie zmienia się po awansie/spadku.
// Gdy dwie drużyny mają identyczną nazwę, dopisujemy do slugu id ligi.
export function buildTeamIndex(teams) {
  const counts = {};
  for (const t of teams) {
    const base = slugify(t.name);
    counts[base] = (counts[base] || 0) + 1;
  }
  const list = teams.map(t => {
    const base = slugify(t.name);
    const slug = counts[base] > 1 ? `${base}-${slugify(t.leagueId)}` : base;
    return { ...t, slug };
  });
  const bySlug = {};
  const byKey = {};
  for (const t of list) {
    bySlug[t.slug] = t;
    byKey[`${t.leagueId}|${t.name}`] = t.slug;
  }
  return { list, bySlug, byKey };
}

export function teamSlugFor(index, name, leagueId) {
  return (index && index.byKey[`${leagueId}|${name}`]) || slugify(name);
}

// --- DATY MECZÓW ---
// 90minut podaje daty bez roku ("16 sierpnia"), więc rok liczymy z sezonu:
// lipiec–grudzień = rok startu sezonu, styczeń–czerwiec = następny.
const MONTHS = { sty: 0, lut: 1, mar: 2, kwi: 3, maj: 4, cze: 5, lip: 6, sie: 7, wrz: 8, paz: 9, 'paź': 9, lis: 10, gru: 11 };

export function parseMatchDate(dataWizualna, godzina) {
  if (!dataWizualna) return null;
  let d = null;
  const dot = dataWizualna.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dot) d = { y: +dot[3], m: +dot[2] - 1, day: +dot[1] };
  else {
    const txt = dataWizualna.match(/^(\d{1,2})\s+([a-ząęółśźćń]+)(?:\s+(\d{4}))?/i);
    if (txt) {
      const key = txt[2].toLowerCase().slice(0, 3);
      const m = MONTHS[key] ?? MONTHS[slugify(key)];
      if (m !== undefined) d = { y: txt[3] ? +txt[3] : (m >= 6 ? SEASON_START_YEAR : SEASON_START_YEAR + 1), m, day: +txt[1] };
    }
  }
  if (!d) return null;
  const t = /^(\d{1,2}):(\d{2})$/.exec(godzina || '');
  const pad = n => String(n).padStart(2, '0');
  // Czas polski: przybliżamy strefą wg miesiąca (CEST kwi–paź, CET reszta)
  const tz = d.m >= 3 && d.m <= 9 ? '+02:00' : '+01:00';
  const iso = `${d.y}-${pad(d.m + 1)}-${pad(d.day)}` + (t ? `T${pad(t[1])}:${t[2]}:00${tz}` : '');
  return { iso, time: new Date(iso).getTime() };
}

const isPlayed = m => m.status === 'Zakończony' && m.wynikGospodarz != null && m.wynikGosc != null;

// Mecze konkretnej drużyny: rozegrane (od najnowszego) i nadchodzące (od najbliższego)
export function splitTeamMatches(mecze, teamName) {
  const own = (mecze || []).filter(m => m.gospodarz.nazwa === teamName || m.gosc.nazwa === teamName);
  return splitMatches(own);
}

export function splitMatches(mecze) {
  const withTime = (mecze || []).map(m => ({ m, t: parseMatchDate(m.dataWizualna, m.godzina)?.time ?? 0 }));
  const played = withTime.filter(x => isPlayed(x.m))
    .sort((a, b) => b.t - a.t || (+b.m.kolejka || 0) - (+a.m.kolejka || 0)).map(x => x.m);
  const upcoming = withTime.filter(x => !isPlayed(x.m))
    .sort((a, b) => a.t - b.t || (+a.m.kolejka || 0) - (+b.m.kolejka || 0)).map(x => x.m);
  return { played, upcoming };
}

export function matchResultFor(match, teamName) {
  const home = match.gospodarz.nazwa === teamName;
  const gf = parseInt(home ? match.wynikGospodarz : match.wynikGosc, 10);
  const ga = parseInt(home ? match.wynikGosc : match.wynikGospodarz, 10);
  return gf > ga ? 'Z' : gf === ga ? 'R' : 'P';
}

export const scoreText = m => `${m.gospodarz.nazwa} ${m.wynikGospodarz}:${m.wynikGosc} ${m.gosc.nazwa}`;

// --- META TAGI (wspólne dla HTML z serwera i dla aplikacji po nawigacji) ---
const trimDesc = s => (s.length > 158 ? s.slice(0, 155).replace(/\s+\S*$/, '') + '…' : s);

export function homeMeta() {
  return {
    title: 'Meczomat – Wyniki niższych lig piłkarskich na żywo | IV liga, okręgówka, A-klasa, B-klasa',
    description: 'Wyniki meczów, tabele ligowe i terminarze z niższych lig piłkarskich w Polsce. IV liga, V liga, klasa okręgowa, A-klasa, B-klasa. Aktualizacje 24/7.',
    path: '/',
  };
}

export function leaguesIndexMeta() {
  return {
    title: `Rozgrywki – tabele i wyniki wszystkich lig ${SEASON_LABEL} | Meczomat`,
    description: 'Tabele, wyniki i terminarze wszystkich lig: Ekstraklasa, I, II, III i IV liga, klasa okręgowa, A-klasa i B-klasa. Wybierz ligę i sprawdź aktualne wyniki.',
    path: '/rozgrywki',
  };
}

export function newsMeta() {
  return {
    title: 'Centrum Kibica – wideo, transmisje i aktualności z niższych lig | Meczomat',
    description: 'Skróty wideo, transmisje na żywo i artykuły z niższych lig polskiej piłki nożnej. Bądź na bieżąco z wynikami ze swojego regionu.',
    path: '/centrum-kibica',
  };
}

export function leagueMeta(league, tabela) {
  const full = leagueFullName(league);
  const leader = tabela && tabela[0];
  const desc = `${league.name}: aktualna tabela, wyniki meczów i terminarz – sezon ${SEASON_LABEL}.` +
    (leader ? ` Prowadzi ${leader.nazwa} (${leader.punkty} pkt).` : '') +
    (league.province !== 'Cała Polska' ? ` Piłka nożna, ${league.province.toLowerCase()}.` : '');
  return {
    title: `${full} – tabela, wyniki, terminarz ${SEASON_LABEL} | Meczomat`,
    description: trimDesc(desc),
    path: leaguePath(league.id),
  };
}

export function teamMeta(team, league, row, played, upcoming) {
  const parts = [`${team.name}: wyniki meczów, terminarz i miejsce w tabeli – ${league.name}, sezon ${SEASON_LABEL}.`];
  if (row) parts.push(`${row.pozycja}. miejsce, ${row.punkty} pkt.`);
  if (played && played[0]) parts.push(`Ostatni mecz: ${scoreText(played[0])}.`);
  else if (upcoming && upcoming[0]) parts.push(`Następny mecz: ${upcoming[0].gospodarz.nazwa} – ${upcoming[0].gosc.nazwa}${upcoming[0].dataWizualna ? `, ${upcoming[0].dataWizualna}` : ''}.`);
  return {
    title: `${team.name} – wyniki, terminarz, tabela | ${league.name} | Meczomat`,
    description: trimDesc(parts.join(' ')),
    path: teamPath(team.slug),
  };
}
