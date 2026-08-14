import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from './api';
import LeagueTable from './LeagueTable';
import MatchList from './MatchList';
import TeamSearch from './TeamSearch';
import CmsPanel from './CmsPanel';
import PublicNews from './PublicNews';
import CookieConsent from './CookieConsent';
import HomeHero from './HomeHero';
import HomeLeagues from './HomeLeagues';
import HomeLatestContent from './HomeLatestContent';

// --- ROZBUDOWANA STRUKTURA LIG ---
const LEAGUE_STRUCTURE = {
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
  { id: 'B-Klasa',         name: 'B-Klasa',      icon: '🟡', type: 'regional',  desc: 'Klasa B' },
];

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive current view from URL path
  const currentView = location.pathname === '/' ? 'home'
    : location.pathname.startsWith('/rozgrywki') ? 'leagues'
    : location.pathname === '/centrum-kibica' ? 'news'
    : location.pathname === '/cms' ? 'cms'
    : 'home';

  const [currentLeague, setCurrentLeague] = useState(null);

  // Dynamic SEO meta per route
  useEffect(() => {
    const SEO = {
      home: {
        title: 'Meczomat – Wyniki niższych lig piłkarskich na żywo | IV liga, V liga, okręgówka',
        desc:  'Wyniki meczów, tabele ligowe i terminarze z niższych lig piłkarskich w Polsce. IV liga, V liga, klasa okręgowa, A-klasa, B-klasa. 16 województw, aktualizacje 24/7.',
      },
      leagues: {
        title: `Rozgrywki ligowe – Tabele i wyniki ${currentLeague ? `| ${currentLeague.toUpperCase()} ` : ''}| Meczomat`,
        desc:  'Tabele i wyniki ze wszystkich klas rozgrywkowych: Ekstraklasa, I Liga, II Liga, III Liga, IV Liga, V Liga, okręgówka, A-klasa, B-klasa. Wybierz swoje województwo.',
      },
      news: {
        title: 'Centrum Kibica – Wideo, transmisje i aktualności piłkarskie | Meczomat',
        desc:  'Skróty wideo, transmisje na żywo i artykuły z niższych lig polskiej piłki nożnej. Bądź na bieżąco z wynikami ze swojego regionu.',
      },
      cms: { title: 'Panel administracyjny | Meczomat', desc: '' },
    };
    const { title, desc } = SEO[currentView] || SEO.home;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://meczomat.pl${location.pathname}`);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', `https://meczomat.pl${location.pathname}`);

    // Inject per-league structured data for Google rich results
    const existingScript = document.getElementById('seo-league-ld');
    if (existingScript) existingScript.remove();
    if (currentView === 'leagues' && currentLeague) {
      const leagueName = currentLeague.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const script = document.createElement('script');
      script.id = 'seo-league-ld';
      script.type = 'application/ld+json';
      script.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${leagueName} – Tabela i wyniki | Meczomat`,
        url: `https://meczomat.pl/rozgrywki/${currentLeague}`,
        description: `Tabela ligowa, terminarz i wyniki meczów: ${leagueName}. Aktualne dane ze wszystkich kolejek sezonu.`,
        inLanguage: 'pl',
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Strona główna', item: 'https://meczomat.pl/' },
            { '@type': 'ListItem', position: 2, name: 'Rozgrywki', item: 'https://meczomat.pl/rozgrywki' },
            { '@type': 'ListItem', position: 3, name: leagueName, item: `https://meczomat.pl/rozgrywki/${currentLeague}` },
          ],
        },
      });
      document.head.appendChild(script);
    }
  }, [currentView, currentLeague, location.pathname]);

  // --- STANY KREATORA (WIZARD) ---
  const [wizardStep, setWizardStep] = useState(1); // 1: Szczebel, 2: Województwo, 3: Grupa, 4: Gotowe
  const [wizLevel, setWizLevel] = useState(null);
  const [wizProv, setWizProv] = useState(null);

  const [favoriteTeam, setFavoriteTeam] = useState(null);
  const [nextMatch, setNextMatch] = useState(null);
  const [targetTeamProfile, setTargetTeamProfile] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalTeams, setGlobalTeams] = useState([]); 

  const [latestContent, setLatestContent] = useState({ article: null, video: null, stream: null });

  useEffect(() => {
    const saved = localStorage.getItem('meczomat_fav_obj');
    if (saved) {
      const parsed = JSON.parse(saved);
      setFavoriteTeam(parsed);
      fetchNextMatch(parsed);
    }

    // Sync league from URL on initial load
    const leagueMatch = location.pathname.match(/^\/rozgrywki\/(.+)/);
    if (leagueMatch) {
      setCurrentLeague(leagueMatch[1]);
      setWizardStep(4);
    }

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

    const fetchAllTeams = async () => {
      const leagues = [];
      for (const prov in LEAGUE_STRUCTURE)
        for (const lvl in LEAGUE_STRUCTURE[prov])
          for (const league of LEAGUE_STRUCTURE[prov][lvl])
            leagues.push({ ...league, province: prov, level: lvl });

      // Pobieramy po 5 na raz żeby nie zalewać API
      const BATCH = 5;
      const all = [];
      for (let i = 0; i < leagues.length; i += BATCH) {
        const batch = leagues.slice(i, i + BATCH);
        const results = await Promise.allSettled(
          batch.map(l => fetch(`${API}/api/tabela?liga=${l.id}`).then(r => r.ok ? r.json() : null))
        );
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled' && Array.isArray(r.value)) {
            r.value.forEach(team => all.push({ name: team.nazwa, leagueId: batch[idx].id, province: batch[idx].province, level: batch[idx].level }));
          }
        });
      }
      setGlobalTeams(all);
    };
    fetchAllTeams();
  }, []);

  const fetchNextMatch = async (teamObj) => {
    try {
      const res = await fetch(`${API}/api/mecze?liga=${teamObj.league}`);
      const mecze = await res.json();
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
        setCurrentLeague(groups[0].id);
        setWizardStep(4);
        navigate('/rozgrywki/' + groups[0].id);
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
      setCurrentLeague(groups[0].id);
      setWizardStep(4);
      navigate('/rozgrywki/' + groups[0].id);
    } else {
      setWizardStep(3);
    }
  };

  const handleGroupSelect = (groupId) => {
    setCurrentLeague(groupId);
    setWizardStep(4);
    navigate('/rozgrywki/' + groupId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeLeagueAndTeam = (prov, lvl, leagueId, teamName) => {
    setWizProv(prov);
    setWizLevel(lvl);
    setCurrentLeague(leagueId);
    setTargetTeamProfile(teamName);
    setWizardStep(4);
    navigate('/rozgrywki/' + leagueId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        <div className="max-w-6xl mx-auto px-5 h-16 flex justify-between items-center gap-4">

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-3 min-h-0 min-w-0 border-0 bg-transparent p-0 cursor-pointer">
            <img src="/Group_2.jpg" alt="Meczomat logo" className="h-9 w-9 rounded-lg object-contain logo-spin flex-shrink-0" />
            <span className="text-lg font-black tracking-tight" style={{ color: 'var(--c-text)' }}>
              meczomat<span style={{ color: 'var(--c-accent)' }}>.pl</span>
            </span>
          </button>

          {/* Nav links */}
          <div className="flex items-center gap-1">
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
              changeLeagueAndTeam={changeLeagueAndTeam}
            />

            {/* Favourite team widget */}
            {favoriteTeam && (
              <section className="max-w-[960px] mx-auto px-6 py-10">
                <div className="fav-widget flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--c-accent)' }}>★ Twój ulubiony klub</p>
                    <h2 className="text-2xl font-black mb-3 truncate" style={{ color: 'var(--c-text)' }}>{favoriteTeam.name}</h2>
                    {nextMatch ? (
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span style={{ color: 'var(--c-text-2)' }}>Następny mecz:</span>
                        <span className="font-bold" style={{ color: 'var(--c-text)' }}>{nextMatch.dataWizualna} · {nextMatch.godzina}</span>
                        <span style={{ color: 'var(--c-text-2)' }}>vs {nextMatch.gospodarz.nazwa === favoriteTeam.name ? nextMatch.gosc.nazwa : nextMatch.gospodarz.nazwa}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--c-text-3)', background: 'var(--c-surface3)' }}>Kolejka {nextMatch.kolejka}</span>
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>Brak nadchodzących meczów w tej lidze.</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => { setTargetTeamProfile(favoriteTeam.name); setCurrentLeague(favoriteTeam.league); setWizardStep(4); navigate('/rozgrywki/' + favoriteTeam.league); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="btn-primary px-5 py-2.5 text-sm rounded-lg">Statystyki →</button>
                    <button onClick={() => toggleFavorite(favoriteTeam.name, favoriteTeam.league)} aria-label="Usuń z ulubionych"
                      className="btn-secondary px-4 py-2.5 text-sm rounded-lg" style={{ color: 'var(--c-text-2)', borderColor: 'var(--c-border)' }}>✕</button>
                  </div>
                </div>
              </section>
            )}

            {/* Leagues section */}
            <HomeLeagues
              onLevelSelect={(levelObj) => {
                handleLevelSelect(levelObj);
                navigate('/rozgrywki');
                window.scrollTo({ top: 0, behavior: 'smooth' });
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

            {wizardStep < 4 ? (
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
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                                 style={{
                                   background: done ? 'var(--c-accent)' : active ? 'var(--c-accent-bg)' : 'var(--c-surface2)',
                                   color: done ? '#0c1410' : active ? 'var(--c-accent)' : 'var(--c-text-3)',
                                   border: `2px solid ${done || active ? 'var(--c-accent)' : 'var(--c-border)'}`,
                                 }}>
                              {done ? '✓' : step}
                            </div>
                            <span className="text-sm font-medium hidden sm:inline"
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
                      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--c-text)' }}>Wybierz klasę rozgrywkową</h2>
                      <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>Wskaż szczebel ligowy, który Cię interesuje.</p>
                    </div>

                    {/* National */}
                    <p className="section-title mb-3">Ogólnopolskie</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {WIZARD_LEVELS.filter(l => l.type === 'national').map(level => (
                        <button key={level.id} onClick={() => handleLevelSelect(level)} className="wizard-btn">
                          <span className="text-3xl">{level.icon}</span>
                          <span className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>{level.name}</span>
                          <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>{level.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Regional */}
                    <p className="section-title mb-3">Regionalne</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {WIZARD_LEVELS.filter(l => l.type === 'regional').map(level => (
                        <button key={level.id} onClick={() => handleLevelSelect(level)} className="wizard-btn">
                          <span className="text-3xl">{level.icon}</span>
                          <span className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>{level.name}</span>
                          <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>{level.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* KROK 2: Województwo */}
                {wizardStep === 2 && (
                  <div className="animate-fade-in-scale">
                    <div className="flex items-center gap-3 mb-7">
                      <button onClick={() => setWizardStep(1)} className="btn-secondary text-sm px-4 py-2 rounded-lg">← Wróć</button>
                      <div>
                        <h2 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Wybierz województwo</h2>
                        <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>dla klasy: <span style={{ color: 'var(--c-accent)' }}>{wizLevel}</span></p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableProvinces.map(prov => (
                        <button key={prov} onClick={() => handleProvinceSelect(prov)} className="wizard-btn-row">
                          <div className="flex items-center gap-2">
                            <span className="text-base">📍</span>
                            <span className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{prov}</span>
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
                      <button onClick={() => setWizardStep(wizProv === "Cała Polska" ? 1 : 2)} className="btn-secondary text-sm px-4 py-2 rounded-lg">← Wróć</button>
                      <div>
                        <h2 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Wybierz grupę</h2>
                        <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>{wizProv} · {wizLevel}</p>
                      </div>
                    </div>
                    {availableGroups.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableGroups.map(group => (
                          <button key={group.id} onClick={() => handleGroupSelect(group.id)} className="wizard-btn-row">
                            <span className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{group.name}</span>
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

            ) : (
              /* KROK 4: Wyniki ligi */
              <>
                {/* League header bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-fade-in-down p-4 rounded-xl"
                     style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-accent)' }}>
                  <div className="pl-1">
                    <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--c-accent)' }}>
                      {wizProv || 'Wyszukiwanie'} · {wizLevel || 'Bezpośrednie'}
                    </p>
                    <h2 className="text-xl font-black" style={{ color: 'var(--c-text)' }}>
                      {currentLeague?.toUpperCase()}
                    </h2>
                  </div>
                  <button onClick={() => setWizardStep(1)} className="btn-secondary text-sm px-5 py-2.5 rounded-lg">
                    ⚙️ Zmień ligę
                  </button>
                </div>

                {/* Data components */}
                <div className="animate-slide-up stagger-1">
                  <TeamSearch
                    leagueId={currentLeague}
                    favoriteTeam={favoriteTeam?.name}
                    toggleFavorite={toggleFavorite}
                    targetTeamProfile={targetTeamProfile}
                    setTargetTeamProfile={setTargetTeamProfile}
                    globalSearchTerm={globalSearchTerm}
                    setGlobalSearchTerm={setGlobalSearchTerm}
                    globalTeams={globalTeams}
                    changeLeagueAndTeam={changeLeagueAndTeam}
                  />
                  <LeagueTable leagueId={currentLeague} favoriteTeam={favoriteTeam?.name} toggleFavorite={toggleFavorite} />
                  <MatchList leagueId={currentLeague} />
                </div>
              </>
            )}
          </div>
        )}

        {currentView === 'news' && <PublicNews />}
        {currentView === 'cms' && <CmsPanel />}
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
