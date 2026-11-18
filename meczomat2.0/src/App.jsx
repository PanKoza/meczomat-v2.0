import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API from './api';
import { fetchLeague, getCachedLeague } from './leagueData';
import { useTeamIndex } from './teamIndex';
import {
  SITE_URL, SEASON_LABEL, LEAGUE_STRUCTURE, getLeague, leaguePath, teamPath, teamSlugFor, leagueFullName, splitTeamMatches,
  homeMeta, newsMeta, leaguesIndexMeta, leagueMeta, teamMeta,
} from './seo/shared';
import LeagueTable from './LeagueTable';
import MatchList from './MatchList';
import SeasonProgress from './SeasonProgress';
import TeamSearch, { TeamProfile } from './TeamSearch';
import CmsPanel from './CmsPanel';
import PublicNews from './PublicNews';
import CookieConsent from './CookieConsent';
import HomeHero from './HomeHero';
import HomeLeagues from './HomeLeagues';
import HomeLatestContent from './HomeLatestContent';

// --- DEFINICJA SZCZEBLI DO KREATORA ---
const WIZARD_LEVELS = [
  { id: 'Ekstraklasa',     name: 'Ekstraklasa', icon: '🏆', type: 'national',  desc: 'Najwyższa klasa rozgrywkowa' },
  { id: 'I Liga',          name: '1. Liga',      icon: '⚽', type: 'national',  desc: 'Bezpośrednie zaplecze Ekstraklasy' },
  { id: 'II Liga',         name: '2. Liga',      icon: '⚽', type: 'national',  desc: 'Trzeci poziom ligowy' },
  { id: 'III Liga',        name: '3. Liga',      icon: '⚽', type: 'national',  desc: 'Czwarty poziom ligowy' },
  { id: 'IV Liga',         name: '4. Liga',      icon: '📍', type: 'regional',  desc: 'Rozgrywki regionalne' },
  { id: 'V Liga',          name: '5. Liga',      icon: '📍', type: 'regional',  desc: 'Rozgrywki regionalne' },
  { id: 'Klasa Okręgowa',  name: 'Okręgówka',   icon: '🎯', type: 'regional',  desc: 'Okręgowy poziom rozgrywek' },
  { id: 'A-Klasa',         name: 'A-Klasa',      icon: '🟢', type: 'regional',  desc: 'Klasa A' },
  { id: 'B-Klasa',         name: 'B-Klasa',      icon: '🍺', type: 'regional',  desc: 'Klasa B' },
];

// Okruszki nawigacyjne (pomagają Google zrozumieć strukturę serwisu)
function Breadcrumbs({ items }) {
  const all = [{ name: 'Strona główna', path: '/' }, ...items];
  return (
    <nav aria-label="Okruszki" className="text-sm mb-4 flex flex-wrap items-baseline gap-1.5" style={{ color: 'var(--c-text-3)' }}>
      {all.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span aria-hidden="true">›</span>}
          {it.path && i < all.length - 1
            ? <Link to={it.path} style={{ color: 'var(--c-text-2)', textDecoration: 'none' }} className="crumb-link hover:underline">{it.name}</Link>
            : <span style={{ color: 'var(--c-text)' }}>{it.name}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

function NotFound() {
  return (
    <div className="text-center py-16 rounded-xl" style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}>
      <span className="text-4xl block mb-3">🤷</span>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--c-text)' }}>Nie znaleziono strony</h1>
      <p className="mb-5" style={{ color: 'var(--c-text-2)' }}>Ta liga lub drużyna nie istnieje albo zmieniła adres.</p>
      <Link to="/rozgrywki" className="btn-primary px-5 py-2.5 text-sm rounded-lg" style={{ textDecoration: 'none' }}>Przejdź do rozgrywek →</Link>
    </div>
  );
}

// Linki do pozostałych grup tej samej klasy rozgrywkowej
function SiblingLeagues({ league }) {
  const siblings = (LEAGUE_STRUCTURE[league.province]?.[league.level] || []).filter(g => g.id !== league.id);
  if (!siblings.length) return null;
  return (
    <nav aria-label={`Inne grupy – ${league.level}`} className="glass-card rounded-2xl p-5 sm:p-6 mt-6">
      <h2 className="text-lg font-black text-brand-cream mb-3">Inne grupy – {league.level}</h2>
      <div className="flex flex-wrap gap-2">
        {siblings.map(g => (
          <Link key={g.id} to={leaguePath(g.id)} className="btn-secondary text-sm px-4 py-2 rounded-lg" style={{ textDecoration: 'none' }}>
            {getLeague(g.id).name}
          </Link>
        ))}
      </div>
    </nav>
  );
}

// Dane z serwera (api/page.js) dotyczą tylko adresu, pod który przyszło pierwsze żądanie
const SSR = typeof window !== 'undefined' ? window.__SSR__ || null : null;

function setHeadMeta({ title, description, path }, robots = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1') {
  const url = SITE_URL + path;
  document.title = title;
  const set = (sel, attr, val) => document.querySelector(sel)?.setAttribute(attr, val);
  set('meta[name="description"]', 'content', description);
  set('meta[name="robots"]', 'content', robots);
  set('link[rel="canonical"]', 'href', url);
  set('meta[property="og:title"]', 'content', title);
  set('meta[property="og:description"]', 'content', description);
  set('meta[property="og:url"]', 'content', url);
  set('meta[name="twitter:title"]', 'content', title);
  set('meta[name="twitter:description"]', 'content', description);
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  // Widok i liga/drużyna wynikają wyłącznie z adresu URL (działa odświeżanie i przycisk „wstecz”)
  const leagueMatch = pathname.match(/^\/rozgrywki\/([^/]+)\/?$/);
  const teamMatch = pathname.match(/^\/druzyna\/([^/]+)\/?$/);
  const currentView = pathname === '/' ? 'home'
    : teamMatch ? 'team'
    : pathname === '/rozgrywki' || leagueMatch ? 'leagues'
    : pathname === '/centrum-kibica' ? 'news'
    : pathname === '/cms' ? 'cms'
    : 'notfound';
  const currentLeague = leagueMatch ? decodeURIComponent(leagueMatch[1]) : null;
  const leagueInfo = currentLeague ? getLeague(currentLeague) : null;

  const teamIndex = useTeamIndex();
  const teamSlug = teamMatch ? decodeURIComponent(teamMatch[1]) : null;
  const currentTeam = teamSlug
    ? (teamIndex?.bySlug[teamSlug] || (SSR?.team?.slug === teamSlug ? SSR.team : null))
    : null;
  const teamLeague = currentTeam ? getLeague(currentTeam.leagueId) : null;

  // Przewijanie na górę przy zmianie podstrony
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);

  // Meta tagi per podstrona — te same generatory co w api/page.js.
  // Przy pierwszym wejściu z serwera nagłówek jest już poprawny, więc go nie ruszamy.
  useEffect(() => {
    const fromServer = SSR && SSR.path === pathname;
    if (!fromServer) document.querySelectorAll('script[data-ssr]').forEach(el => el.remove());
    if (fromServer) return;

    if (currentView === 'home') setHeadMeta(homeMeta());
    else if (currentView === 'news') setHeadMeta(newsMeta());
    else if (currentView === 'cms') setHeadMeta({ title: 'Panel administracyjny | Meczomat', description: '', path: '/cms' }, 'noindex, nofollow');
    else if (currentView === 'leagues' && !currentLeague) setHeadMeta(leaguesIndexMeta());
    else if (currentView === 'leagues' && leagueInfo) setHeadMeta(leagueMeta(leagueInfo, getCachedLeague('tabela', currentLeague)));
    else if (currentView === 'team' && currentTeam && teamLeague) {
      const tabela = getCachedLeague('tabela', currentTeam.leagueId) || [];
      const { played, upcoming } = splitTeamMatches(getCachedLeague('mecze', currentTeam.leagueId), currentTeam.name);
      setHeadMeta(teamMeta(currentTeam, teamLeague, tabela.find(r => r.nazwa === currentTeam.name), played, upcoming));
    } else if (currentView === 'notfound' || (currentView === 'leagues' && !leagueInfo) || (currentView === 'team' && teamIndex && !currentTeam)) {
      setHeadMeta({ title: 'Nie znaleziono strony | Meczomat', description: '', path: pathname }, 'noindex, follow');
    }
  }, [pathname, currentView, currentLeague, leagueInfo, currentTeam, teamLeague, teamIndex]);

  // --- STANY KREATORA (WIZARD) ---
  const [wizardStep, setWizardStep] = useState(1); // 1: Szczebel, 2: Województwo, 3: Grupa
  const [wizLevel, setWizLevel] = useState(null);
  const [wizProv, setWizProv] = useState(null);

  const [favoriteTeam, setFavoriteTeam] = useState(null);
  const [nextMatch, setNextMatch] = useState(null);

  const [searchInput, setSearchInput] = useState('');

  const [latestContent, setLatestContent] = useState({ article: null, video: null, stream: null });

  // Lista drużyn do wyszukiwarek — z jednego indeksu /api/druzyny
  const globalTeams = useMemo(() => (teamIndex ? teamIndex.list : [])
    .map(t => {
      const l = getLeague(t.leagueId);
      return l ? { ...t, province: l.province, level: l.level } : null;
    })
    .filter(Boolean), [teamIndex]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('meczomat_fav_obj');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFavoriteTeam(parsed);
        fetchNextMatch(parsed);
      }
    } catch { /* brak dostępu do storage */ }

    const fetchLatest = async () => {
      try {
        const [artRes, vidRes, strRes] = await Promise.all([
          fetch(`${API}/api/articles`),
          fetch(`${API}/api/videos`),
          fetch(`${API}/api/streams`)
        ]);
        const articles = await artRes.json();
        const videos = await vidRes.json();
        const streams = await strRes.json();

        setLatestContent({
          article: Array.isArray(articles) && articles.length > 0 ? articles[0] : null,
          video: Array.isArray(videos) && videos.length > 0 ? videos[0] : null,
          stream: Array.isArray(streams) && streams.length > 0 ? streams[0] : null
        });
      } catch (e) { console.error("Błąd nowości", e); }
    };
    fetchLatest();
  }, []);

  const fetchNextMatch = async (teamObj) => {
    try {
      const mecze = await fetchLeague('mecze', teamObj.league);
      if (Array.isArray(mecze)) {
        const upcoming = mecze.find(m => (m.gospodarz.nazwa === teamObj.name || m.gosc.nazwa === teamObj.name) && m.status === 'Nierozegrany');
        setNextMatch(upcoming);
      }
    } catch (e) { console.error("Błąd", e); }
  };

  const toggleFavorite = (teamName, leagueId) => {
    if (favoriteTeam?.name === teamName) {
      setFavoriteTeam(null); setNextMatch(null); localStorage.removeItem('meczomat_fav_obj');
    } else {
      const newFav = { name: teamName, league: leagueId };
      setFavoriteTeam(newFav); localStorage.setItem('meczomat_fav_obj', JSON.stringify(newFav)); fetchNextMatch(newFav);
    }
  };

  // --- LOGIKA KREATORA (WIZARD) ---
  const handleLevelSelect = (levelObj) => {
    setWizLevel(levelObj.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (levelObj.type === 'national') {
      setWizProv("Cała Polska");
      const groups = LEAGUE_STRUCTURE["Cała Polska"][levelObj.id];
      if (groups && groups.length === 1) {
        navigate(leaguePath(groups[0].id));
      } else {
        setWizardStep(3);
      }
    } else {
      setWizardStep(2);
    }
  };

  const handleProvinceSelect = (provName) => {
    setWizProv(provName);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const groups = LEAGUE_STRUCTURE[provName][wizLevel] || [];
    if (groups.length === 1) {
      navigate(leaguePath(groups[0].id));
    } else {
      setWizardStep(3);
    }
  };

  const handleGroupSelect = (groupId) => navigate(leaguePath(groupId));

  const openTeam = (team) => navigate(teamPath(team.slug || teamSlugFor(teamIndex, team.name, team.leagueId)));

  const openLeagueWizard = () => { setWizardStep(1); navigate('/rozgrywki'); };

  const filteredGlobalTeams = searchInput.trim() 
    ? globalTeams.filter(t => t.name.toLowerCase().includes(searchInput.toLowerCase())) : [];

  // Pomocnicze zmienne do widoku kreatora
  const availableProvinces = Object.keys(LEAGUE_STRUCTURE).filter(k => k !== "Cała Polska");
  const availableGroups = (wizProv && wizLevel && LEAGUE_STRUCTURE[wizProv] && LEAGUE_STRUCTURE[wizProv][wizLevel]) 
    ? LEAGUE_STRUCTURE[wizProv][wizLevel] : [];

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <CookieConsent />

      {/* ================================================================
          NAVBAR
          ================================================================ */}
      <nav className="glass-nav sticky top-0 z-50 animate-fade-in-down">
        <div className="max-w-6xl mx-auto px-4 h-[64px] sm:h-[72px] flex justify-between items-center gap-2">

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 min-h-0 min-w-0 border-0 bg-transparent p-0 cursor-pointer flex-shrink-0">
            <img src="/Group_2.jpg" alt="Meczomat logo" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg object-contain logo-spin flex-shrink-0" />
            <span className="text-lg sm:text-xl font-black tracking-tight" style={{ color: 'var(--c-text)' }}>
              meczomat<span style={{ color: 'var(--c-accent)' }}>.pl</span>
            </span>
          </button>

          {/* Nav links */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            {[
              { key: 'leagues',  label: 'Rozgrywki',      icon: '⚽', action: () => { setWizardStep(1); navigate('/rozgrywki'); } },
              { key: 'news',     label: 'Centrum Kibica',  icon: '📺', action: () => navigate('/centrum-kibica') },
              { key: 'cms',      label: 'CMS',             icon: '⚙️', action: () => navigate('/cms') },
            ].map(item => (
              <button key={item.key} onClick={item.action}
                className={`nav-link${currentView === item.key ? ' active' : ''}`}>
                <span className="text-base">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ================================================================
          MAIN CONTENT
          ================================================================ */}
      <main className="flex-grow w-full">

        {/* ============================================================
            HOME VIEW
            ============================================================ */}
        {currentView === 'home' && (
          <div>
            {/* Hero with search */}
            <HomeHero
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              filteredGlobalTeams={filteredGlobalTeams}
              onPickTeam={openTeam}
            />

            {/* Favourite team widget */}
            {favoriteTeam && (
              <section className="max-w-[960px] mx-auto px-6 py-10">
                <div className="fav-widget flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--c-accent)' }}>★ Twój ulubiony klub</p>
                    <h2 className="text-3xl font-black mb-3 truncate" style={{ color: 'var(--c-text)' }}>{favoriteTeam.name}</h2>
                    {nextMatch ? (
                      <div className="flex flex-wrap items-center gap-3 text-base">
                        <span style={{ color: 'var(--c-text-2)' }}>Następny mecz:</span>
                        <span className="font-bold" style={{ color: 'var(--c-text)' }}>{nextMatch.dataWizualna} · {nextMatch.godzina}</span>
                        <span style={{ color: 'var(--c-text-2)' }}>vs {nextMatch.gospodarz.nazwa === favoriteTeam.name ? nextMatch.gosc.nazwa : nextMatch.gospodarz.nazwa}</span>
                        <span className="text-sm px-2 py-1 rounded" style={{ color: 'var(--c-text-3)', background: 'var(--c-surface3)' }}>Kolejka {nextMatch.kolejka}</span>
                      </div>
                    ) : (
                      <p className="text-base" style={{ color: 'var(--c-text-2)' }}>Brak nadchodzących meczów w tej lidze.</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link to={teamPath(teamSlugFor(teamIndex, favoriteTeam.name, favoriteTeam.league))}
                      className="btn-primary px-5 py-2.5 text-sm rounded-lg" style={{ textDecoration: 'none' }}>Statystyki →</Link>
                    <button onClick={() => toggleFavorite(favoriteTeam.name, favoriteTeam.league)} aria-label="Usuń z ulubionych"
                      className="btn-secondary px-4 py-2.5 text-sm rounded-lg" style={{ color: 'var(--c-text-2)', borderColor: 'var(--c-border)' }}>✕</button>
                  </div>
                </div>
              </section>
            )}

            {/* Leagues section */}
            <HomeLeagues
              onLevelSelect={(levelObj) => {
                // Najpierw lista rozgrywek; handleLevelSelect może od razu przejść do konkretnej ligi
                navigate('/rozgrywki');
                handleLevelSelect(levelObj);
              }}
            />

            {/* Latest content */}
            <HomeLatestContent latestContent={latestContent} />
          </div>
        )}

        {/* ============================================================
            LEAGUES VIEW — WIZARD
            ============================================================ */}
        {currentView === 'leagues' && (
          <div className="max-w-4xl mx-auto px-5 py-8">

            {!currentLeague ? (
              <div className="animate-slide-up">

                {/* Progress */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    {['Klasa rozgrywkowa', 'Województwo', 'Grupa'].map((label, i) => {
                      const step = i + 1;
                      const done = wizardStep > step;
                      const active = wizardStep === step;
                      return (
                        <React.Fragment key={step}>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all"
                                 style={{
                                   background: done ? 'var(--c-accent)' : active ? 'var(--c-accent-bg)' : 'var(--c-surface2)',
                                   color: done ? '#0c1410' : active ? 'var(--c-accent)' : 'var(--c-text-3)',
                                   border: `2px solid ${done || active ? 'var(--c-accent)' : 'var(--c-border)'}`,
                                 }}>
                              {done ? '✓' : step}
                            </div>
                            <span className="text-base font-medium hidden sm:inline"
                                  style={{ color: active ? 'var(--c-text)' : 'var(--c-text-3)' }}>
                              {label}
                            </span>
                          </div>
                          {i < 2 && (
                            <div className="flex-1 h-px" style={{ background: wizardStep > step ? 'var(--c-accent)' : 'var(--c-border)' }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* KROK 1: Klasa rozgrywkowa */}
                {wizardStep === 1 && (
                  <div className="animate-fade-in-scale">
                    <div className="mb-7">
                    <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--c-text)' }}>Rozgrywki – wybierz klasę rozgrywkową</h1>
                    <p className="text-base" style={{ color: 'var(--c-text-2)' }}>Wskaż szczebel ligowy, który Cię interesuje.</p>
                    </div>

                    {/* National */}
                    <p className="section-title mb-3">Ogólnopolskie</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {WIZARD_LEVELS.filter(l => l.type === 'national').map(level => (
                        <button key={level.id} onClick={() => handleLevelSelect(level)} className="wizard-btn">
                          <span className="text-4xl">{level.icon}</span>
                          <span className="font-bold text-base" style={{ color: 'var(--c-text)' }}>{level.name}</span>
                          <span className="text-sm" style={{ color: 'var(--c-text-3)' }}>{level.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Regional */}
                    <p className="section-title mb-3">Regionalne</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {WIZARD_LEVELS.filter(l => l.type === 'regional').map(level => (
                        <button key={level.id} onClick={() => handleLevelSelect(level)} className="wizard-btn">
                          <span className="text-4xl">{level.icon}</span>
                          <span className="font-bold text-base" style={{ color: 'var(--c-text)' }}>{level.name}</span>
                          <span className="text-sm" style={{ color: 'var(--c-text-3)' }}>{level.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* KROK 2: Województwo */}
                {wizardStep === 2 && (
                  <div className="animate-fade-in-scale">
                    <div className="flex items-center gap-3 mb-7">
                      <button onClick={() => setWizardStep(1)} className="btn-secondary text-base px-5 py-3 rounded-lg">← Wróć</button>
                      <div>
                        <h2 className="text-3xl font-bold" style={{ color: 'var(--c-text)' }}>Wybierz województwo</h2>
                        <p className="text-base" style={{ color: 'var(--c-text-2)' }}>dla klasy: <span style={{ color: 'var(--c-accent)' }}>{wizLevel}</span></p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableProvinces.map(prov => (
                        <button key={prov} onClick={() => handleProvinceSelect(prov)} className="wizard-btn-row">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">📍</span>
                            <span className="font-semibold text-base" style={{ color: 'var(--c-text)' }}>{prov}</span>
                          </div>
                          <span style={{ color: 'var(--c-accent)' }}>›</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* KROK 3: Grupa */}
                {wizardStep === 3 && (
                  <div className="animate-fade-in-scale">
                    <div className="flex items-center gap-3 mb-7">
                      <button onClick={() => setWizardStep(wizProv === "Cała Polska" ? 1 : 2)} className="btn-secondary text-base px-5 py-3 rounded-lg">← Wróć</button>
                      <div>
                        <h2 className="text-3xl font-bold" style={{ color: 'var(--c-text)' }}>Wybierz grupę</h2>
                        <p className="text-base" style={{ color: 'var(--c-text-2)' }}>{wizProv} · {wizLevel}</p>
                      </div>
                    </div>
                    {availableGroups.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableGroups.map(group => (
                          <button key={group.id} onClick={() => handleGroupSelect(group.id)} className="wizard-btn-row">
                            <span className="font-semibold text-base" style={{ color: 'var(--c-text)' }}>{group.name}</span>
                            <span style={{ color: 'var(--c-accent)' }}>›</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 rounded-xl" style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}>
                        <span className="text-3xl block mb-3">🚧</span>
                        <h3 className="font-bold mb-1" style={{ color: 'var(--c-text)' }}>Ta liga jest w przygotowaniu</h3>
                        <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>Grupy zostaną dodane wkrótce.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

            ) : !leagueInfo ? (
              <NotFound />
            ) : (
              /* Wyniki ligi */
              <>
                <Breadcrumbs items={[{ name: 'Rozgrywki', path: '/rozgrywki' }, { name: leagueInfo.name }]} />
                {/* League header bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-fade-in-down p-4 rounded-xl"
                     style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-accent)' }}>
                  <div className="pl-1">
                    <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--c-accent)' }}>
                      {leagueInfo.province} · {leagueInfo.level} · Sezon {SEASON_LABEL}
                    </p>
                    <h1 className="text-xl font-black" style={{ color: 'var(--c-text)' }}>
                      {leagueFullName(leagueInfo)} – tabela i wyniki
                    </h1>
                  </div>
                  <button onClick={openLeagueWizard} className="btn-secondary text-sm px-5 py-2.5 rounded-lg">
                    ⚙️ Zmień ligę
                  </button>
                </div>

                {/* Data components */}
                <div className="animate-slide-up stagger-1">
                  <TeamSearch globalTeams={globalTeams} onPickTeam={openTeam} />
                  <LeagueTable leagueId={currentLeague} favoriteTeam={favoriteTeam?.name} toggleFavorite={toggleFavorite}
                    title={`Tabela – ${leagueInfo.name}`} />
                  <SeasonProgress leagueId={currentLeague} favoriteTeam={favoriteTeam?.name} />
                  <MatchList leagueId={currentLeague} />
                  <SiblingLeagues league={leagueInfo} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================
            TEAM VIEW — /druzyna/:slug
            ============================================================ */}
        {currentView === 'team' && (
          <div className="max-w-4xl mx-auto px-5 py-8">
            {currentTeam && teamLeague ? (
              <>
                <Breadcrumbs items={[
                  { name: 'Rozgrywki', path: '/rozgrywki' },
                  { name: teamLeague.name, path: leaguePath(teamLeague.id) },
                  { name: currentTeam.name },
                ]} />
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--c-accent)' }}>
                  <Link to={leaguePath(teamLeague.id)} className="crumb-link hover:underline" style={{ color: 'inherit', textDecoration: 'none' }}>{leagueFullName(teamLeague)}</Link> · Sezon {SEASON_LABEL}
                </p>
                <div className="animate-slide-up stagger-1">
                  <TeamProfile teamName={currentTeam.name} leagueId={currentTeam.leagueId}
                    favoriteTeam={favoriteTeam?.name} toggleFavorite={toggleFavorite} />
                  <LeagueTable leagueId={currentTeam.leagueId} favoriteTeam={favoriteTeam?.name} toggleFavorite={toggleFavorite}
                    highlightTeam={currentTeam.name} title={`Tabela – ${teamLeague.name}`} />
                  <SeasonProgress leagueId={currentTeam.leagueId} favoriteTeam={currentTeam.name} />
                  <div className="mt-10">
                    <TeamSearch globalTeams={globalTeams} onPickTeam={openTeam} />
                  </div>
                </div>
              </>
            ) : teamIndex ? (
              <NotFound />
            ) : (
              <div className="flex flex-col justify-center items-center p-16 glass-card rounded-2xl mt-6">
                <div className="w-10 h-10 border-3 border-brand-accent/10 border-t-brand-accent rounded-full animate-spin mb-4"></div>
                <span className="text-sm font-bold text-brand-cream/25 animate-pulse uppercase tracking-widest">Ładowanie drużyny...</span>
              </div>
            )}
          </div>
        )}

        {currentView === 'news' && <PublicNews />}
        {currentView === 'cms' && <CmsPanel />}
        {currentView === 'notfound' && <div className="max-w-4xl mx-auto px-5 py-8"><NotFound /></div>}
      </main>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' }} className="py-12">
        <div className="max-w-5xl mx-auto px-5">

          {/* Logo + tagline */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src="/Group_2.jpg" alt="Meczomat – wyniki niższych lig piłkarskich" className="h-9 w-9 rounded-lg object-contain opacity-60" />
            <span className="font-black text-lg" style={{ color: 'var(--c-text-2)' }}>
              meczomat<span style={{ color: 'var(--c-accent)' }}>.pl</span>
            </span>
          </div>

          {/* SEO text block — visible text for crawlers */}
          <div className="max-w-3xl mx-auto text-center mb-8">
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--c-text-2)' }}>
              <strong style={{ color: 'var(--c-text)' }}>Meczomat</strong> to serwis z wynikami meczów piłkarskich,
              tabelami ligowymi i terminarzami spotkań niższych lig w Polsce.
              Obejmujemy wszystkie szczeble rozgrywek — od{' '}
              <strong style={{ color: 'var(--c-text)' }}>Ekstraklasy</strong> i{' '}
              <strong style={{ color: 'var(--c-text)' }}>I Ligi</strong> aż po{' '}
              <strong style={{ color: 'var(--c-text)' }}>IV ligę</strong>,{' '}
              <strong style={{ color: 'var(--c-text)' }}>V ligę</strong>,{' '}
              <strong style={{ color: 'var(--c-text)' }}>klasę okręgową</strong>,{' '}
              <strong style={{ color: 'var(--c-text)' }}>A-klasę</strong> i{' '}
              <strong style={{ color: 'var(--c-text)' }}>B-klasę</strong>{' '}
              ze wszystkich <strong style={{ color: 'var(--c-text)' }}>16 województw</strong> w Polsce.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-3)' }}>
              Wyniki na żywo · Tabele ligowe · Terminarze meczów · Piłka nożna Dolnośląskie ·
              IV Liga Wrocław · V Liga Polska · Okręgówka · A-Klasa · B-Klasa
            </p>
          </div>

          {/* Navigation links for SEO internal linking */}
          <nav aria-label="Linki wewnętrzne" className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
            {[
              { href: '/', label: 'Strona główna' },
              { href: '/rozgrywki', label: 'Rozgrywki' },
              { href: '/rozgrywki/ekstraklasa', label: 'Ekstraklasa' },
              { href: '/rozgrywki/1-liga', label: '1. Liga' },
              { href: '/rozgrywki/iv-liga', label: 'IV Liga' },
              { href: '/rozgrywki/okregowka-Wroclaw', label: 'Okręgówka' },
              { href: '/centrum-kibica', label: 'Centrum Kibica' },
            ].map(link => (
              <a key={link.href} href={link.href}
                onClick={e => { e.preventDefault(); navigate(link.href); window.scrollTo({ top: 0 }); }}
                className="text-xs font-medium transition-colors"
                style={{ color: 'var(--c-text-3)', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = 'var(--c-accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--c-text-3)'}>
                {link.label}
              </a>
            ))}
          </nav>

          <p className="text-xs text-center" style={{ color: 'var(--c-text-3)' }}>
            © {new Date().getFullYear()} meczomat.pl — Wszystkie dane pobierane automatycznie. Aktualizacje 24/7.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
