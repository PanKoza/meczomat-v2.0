import React, { useState, useEffect } from 'react';
import LeagueTable from './LeagueTable';
import MatchList from './MatchList';
import TeamSearch from './TeamSearch';
import CmsPanel from './CmsPanel';
import PublicNews from './PublicNews';

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
    "Klasa Okręgowa": [
      { id: "okregowka-Wroclaw", name: "Grupa Wrocław" },
      { id: "okregowka-Legnica", name: "Grupa Legnica" },
      { id: "okregowka-Jelenia-Gora", name: "Grupa Jelenia Góra" },
      { id: "okregowka-Walbrzych", name: "Grupa Wałbrzych" }
    ],
    "A-Klasa": [{ id: "a-klasa", name: "Wybierz grupę A-Klasy..." }]
  }
};

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedProvince, setSelectedProvince] = useState("Cała Polska");
  const [selectedLevel, setSelectedLevel] = useState("Ekstraklasa");
  const [currentLeague, setCurrentLeague] = useState("ekstraklasa");

  const [favoriteTeam, setFavoriteTeam] = useState(null);
  const [nextMatch, setNextMatch] = useState(null);
  const [targetTeamProfile, setTargetTeamProfile] = useState(null);

  // --- STANY WYSZUKIWARKI CENTRALNEJ ---
  const [searchInput, setSearchInput] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalTeams, setGlobalTeams] = useState([]); // <-- Przechowuje listę wszystkich klubów

  const [latestContent, setLatestContent] = useState({
    article: null, video: null, stream: null
  });

  useEffect(() => {
    const saved = localStorage.getItem('meczomat_fav_obj');
    if (saved) {
      const parsed = JSON.parse(saved);
      setFavoriteTeam(parsed);
      fetchNextMatch(parsed);
    }

    const fetchLatest = async () => {
      try {
        const [artRes, vidRes, strRes] = await Promise.all([
          fetch('http://localhost:3001/api/articles'),
          fetch('http://localhost:3001/api/videos'),
          fetch('http://localhost:3001/api/streams')
        ]);
        const articles = await artRes.json();
        const videos = await vidRes.json();
        const streams = await strRes.json();

        // Dodajemy zabezpieczenie Array.isArray na wszelki wypadek
        setLatestContent({
          article: Array.isArray(articles) && articles.length > 0 ? articles[0] : null,
          video: Array.isArray(videos) && videos.length > 0 ? videos[0] : null,
          stream: Array.isArray(streams) && streams.length > 0 ? streams[0] : null
        });
      } catch (e) {
        console.error("Błąd pobierania nowości", e);
      }
    };
    fetchLatest();

    // Budowanie globalnego słownika drużyn Z ZABEZPIECZENIEM
    const fetchAllTeams = async () => {
      let all = [];
      for (const prov in LEAGUE_STRUCTURE) {
        for (const lvl in LEAGUE_STRUCTURE[prov]) {
          for (const league of LEAGUE_STRUCTURE[prov][lvl]) {
            try {
              const res = await fetch(`http://localhost:3001/api/tabela?liga=${league.id}`);
              const data = await res.json();
              
              // ZABEZPIECZENIE: Upewniamy się, że dane to tablica, zanim użyjemy .forEach
              if (Array.isArray(data)) {
                data.forEach(team => {
                  all.push({
                    name: team.nazwa,
                    leagueId: league.id,
                    province: prov,
                    level: lvl
                  });
                });
              }
            } catch (e) { console.error("Pominięto ligę:", league.id); }
          }
        }
      }
      setGlobalTeams(all);
    };
    fetchAllTeams();
  }, []);

  const fetchNextMatch = async (teamObj) => {
    try {
      const res = await fetch(`http://localhost:3001/api/mecze?liga=${teamObj.league}`);
      const mecze = await res.json();
      if (Array.isArray(mecze)) {
        const upcoming = mecze.find(m => 
          (m.gospodarz.nazwa === teamObj.name || m.gosc.nazwa === teamObj.name) && 
          m.status === 'Nierozegrany'
        );
        setNextMatch(upcoming);
      }
    } catch (e) { console.error("Błąd pobierania następnego meczu", e); }
  };

  const toggleFavorite = (teamName, leagueId) => {
    if (favoriteTeam?.name === teamName) {
      setFavoriteTeam(null); setNextMatch(null); localStorage.removeItem('meczomat_fav_obj');
    } else {
      const newFav = { name: teamName, league: leagueId };
      setFavoriteTeam(newFav); localStorage.setItem('meczomat_fav_obj', JSON.stringify(newFav)); fetchNextMatch(newFav);
    }
  };

  const handleProvinceChange = (e) => {
    const prov = e.target.value; setSelectedProvince(prov);
    const firstLevel = Object.keys(LEAGUE_STRUCTURE[prov])[0]; setSelectedLevel(firstLevel);
    setCurrentLeague(LEAGUE_STRUCTURE[prov][firstLevel][0].id);
  };

  const handleLevelChange = (e) => {
    const lvl = e.target.value; setSelectedLevel(lvl);
    setCurrentLeague(LEAGUE_STRUCTURE[selectedProvince][lvl][0].id);
  };

  // --- FUNKCJA ZMIANY WIDOKU DLA WYSZUKIWARKI ---
  const changeLeagueAndTeam = (prov, lvl, leagueId, teamName) => {
    setSelectedProvince(prov);
    setSelectedLevel(lvl);
    setCurrentLeague(leagueId);
    setTargetTeamProfile(teamName);
    setCurrentView('leagues');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtrowanie drużyn na stronie głównej
  const filteredGlobalTeams = searchInput.trim() 
    ? globalTeams.filter(t => t.name.toLowerCase().includes(searchInput.toLowerCase()))
    : [];

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setGlobalSearchTerm(searchInput); 
    setCurrentView('leagues'); 
    setSearchInput(''); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 glass-nav animate-fade-in-down">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div onClick={() => setCurrentView('home')} className="flex items-center gap-3 cursor-pointer group">
            <img src="/Group_2.jpg" alt="logo" className="h-10 w-10 object-contain logo-spin rounded-lg ring-1 ring-brand-accent/20" />
            <span className="text-xl font-black tracking-tight text-brand-cream">meczomat<span className="text-brand-accent">.pl</span></span>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'leagues', label: 'Rozgrywki', icon: '🏆' },
              { key: 'news', label: 'Centrum Kibica', icon: '📺' },
              { key: 'cms', label: 'CMS', icon: '⚙️' }
            ].map(item => (
              <button key={item.key} onClick={() => setCurrentView(item.key)}
                className={`text-sm px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all duration-300 ${
                  currentView === item.key
                    ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/20 shadow-[0_0_16px_rgba(0,255,136,0.1)]'
                    : 'text-brand-cream/50 hover:text-brand-cream hover:bg-white/5 border border-transparent'
                }`}>
                <span>{item.icon}</span><span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ===== MAIN ===== */}
      <main className="flex-grow py-10 max-w-6xl mx-auto px-4 w-full">

        {/* ===== HOME ===== */}
        {currentView === 'home' && (
          <div className="animate-fade-in flex flex-col items-center pt-4">
            
            {/* Favorite team widget */}
            {favoriteTeam && (
              <div className="w-full max-w-5xl mb-12 animate-fade-in">
                <div className="glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent"></div>
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1">
                      <p className="text-brand-accent/60 font-bold text-[10px] uppercase tracking-[0.25em] mb-2">⬡ Twój Klub</p>
                      <h2 className="text-3xl sm:text-4xl font-black text-brand-cream mb-4 flex items-center gap-3">
                        <span className="text-yellow-400 text-2xl">★</span> {favoriteTeam.name}
                      </h2>
                      <div className="glass-surface rounded-xl p-4 inline-block">
                        {nextMatch ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-brand-cream/30 uppercase tracking-widest">Nadchodzące spotkanie</span>
                            <div className="flex items-center gap-3">
                              <span className="text-brand-accent font-black text-lg">🗓️ {nextMatch.dataWizualna}</span>
                              <span className="text-brand-cream/15">|</span>
                              <span className="text-brand-cream font-bold">vs {nextMatch.gospodarz.nazwa === favoriteTeam.name ? nextMatch.gosc.nazwa : nextMatch.gospodarz.nazwa}</span>
                            </div>
                            <span className="text-xs font-medium text-brand-cream/30">Godzina: {nextMatch.godzina} · Kolejka {nextMatch.kolejka}</span>
                          </div>
                        ) : (
                          <span className="text-brand-cream/30 font-medium text-sm">Brak zaplanowanych meczów w tej lidze.</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setTargetTeamProfile(favoriteTeam.name); setCurrentLeague(favoriteTeam.league); setCurrentView('leagues'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="btn-neon px-6 py-3 rounded-xl text-sm flex items-center gap-2">
                        Statystyki <span className="text-lg">→</span>
                      </button>
                      <button onClick={() => toggleFavorite(favoriteTeam.name, favoriteTeam.league)}
                        className="w-12 h-12 rounded-xl border border-brand-cream/10 text-brand-cream/30 hover:text-red-400 hover:border-red-400/30 transition-all flex items-center justify-center text-xl">✕</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HERO */}
            <div className="text-center max-w-4xl mb-10 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-brand-accent/10 rounded-full blur-[120px] -z-10"></div>
              <img src="/Group_2.jpg" alt="logo" className="h-32 w-32 mx-auto mb-8 drop-shadow-[0_0_40px_rgba(0,255,136,0.15)] rounded-2xl logo-spin ring-1 ring-brand-accent/10" />
              <h1 className="text-5xl md:text-7xl font-black text-brand-cream mb-5 tracking-tight leading-[0.95]">
                Piłka nożna<br/><span className="text-brand-accent animate-neon">na żywo</span>
              </h1>
              <p className="text-lg text-brand-cream/40 max-w-xl mx-auto leading-relaxed mb-10">
                Zautomatyzowane wyniki, tabele i relacje z Twojego regionu w nowoczesnym wydaniu.
              </p>
            </div>

            {/* WYSZUKIWARKA GLOBALNA */}
            <div className="w-full max-w-2xl mx-auto mb-16 relative z-30 animate-fade-in stagger-3">
              <div className="relative flex items-center group">
                <div className="absolute left-5 text-xl text-brand-accent/40">🔍</div>
                <input 
                  type="text" 
                  placeholder="Znajdź swój klub (np. Górnik, Śląsk)..." 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-futuristic w-full pl-14 pr-6 py-4 text-base rounded-2xl"
                />
              </div>
              
              {searchInput.trim() && filteredGlobalTeams.length > 0 && (
                <ul className="absolute z-40 w-full mt-2 glass-surface rounded-xl shadow-2xl max-h-72 overflow-y-auto border border-brand-accent/10">
                  {filteredGlobalTeams.map((team, idx) => (
                    <li 
                      key={idx}
                      onClick={() => {
                        setSearchInput('');
                        changeLeagueAndTeam(team.province, team.level, team.leagueId, team.name);
                      }}
                      className="p-4 hover:bg-brand-accent/10 cursor-pointer border-b border-brand-accent/5 last:border-b-0 flex justify-between items-center transition-colors"
                    >
                      <span className="font-bold text-brand-cream">{team.name}</span>
                      <span className="text-[10px] font-bold text-brand-cream/30 bg-brand-accent/5 px-2.5 py-1 rounded-md border border-brand-accent/10">
                        {team.province} • {team.level}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Nav cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mb-16">
              <div onClick={() => setCurrentView('leagues')}
                className="floating-card cursor-pointer glass-card p-8 sm:p-10 rounded-2xl group">
                <div className="text-4xl mb-5">🏆</div>
                <h3 className="text-2xl font-black text-brand-cream mb-2">Rozgrywki</h3>
                <p className="text-brand-cream/35 mb-6">Wszystkie szczeble ligowe, od Ekstraklasy po A-Klasę.</p>
                <span className="btn-neon px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2">Wybierz ligę →</span>
              </div>
              <div onClick={() => setCurrentView('news')}
                className="floating-card cursor-pointer glass-card p-8 sm:p-10 rounded-2xl group">
                <div className="text-4xl mb-5">📺</div>
                <h3 className="text-2xl font-black text-brand-cream mb-2">Centrum Kibica</h3>
                <p className="text-brand-cream/35 mb-6">Skróty wideo, relacje i wiadomości ze stadionów.</p>
                <span className="btn-neon px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2">Oglądaj →</span>
              </div>
            </div>

            {/* Recently added */}
            <div className="w-full max-w-6xl mb-16">
              <div className="flex items-center gap-4 mb-8 justify-center">
                <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-brand-accent/30"></div>
                <h2 className="text-sm font-black text-brand-cream/50 uppercase tracking-[0.2em]">Ostatnio dodane</h2>
                <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-brand-accent/30"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Article */}
                {latestContent.article ? (
                  <div onClick={() => setCurrentView('news')}
                    className="glass-card p-6 rounded-2xl cursor-pointer relative overflow-hidden flex flex-col group">
                    <div className="absolute top-0 left-0 w-[2px] h-full bg-blue-400/60"></div>
                    <div className="text-2xl mb-3 opacity-80">📰</div>
                    <h3 className="font-bold text-lg text-brand-cream mb-2 line-clamp-2">{latestContent.article.title}</h3>
                    <p className="text-sm text-brand-cream/30 line-clamp-3 mb-4 flex-grow">{latestContent.article.content}</p>
                    <div className="text-[10px] font-bold text-brand-cream/20 uppercase tracking-wider flex justify-between items-center">
                      <span className="bg-blue-400/10 text-blue-400 px-2 py-1 rounded">✍️ {latestContent.article.author}</span>
                      <span>{latestContent.article.date}</span>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-brand-cream/20 min-h-[220px]">
                    <span className="text-3xl mb-2 opacity-30">📰</span>
                    <span className="font-medium text-sm">Brak artykułów</span>
                  </div>
                )}

                {/* Video */}
                {latestContent.video ? (
                  <div className="glass-card rounded-2xl overflow-hidden flex flex-col group">
                    <div className="relative pt-[56.25%] bg-black/40">
                      <iframe className="absolute top-0 left-0 w-full h-full" src={latestContent.video.embedUrl} title={latestContent.video.title} frameBorder="0" allowFullScreen></iframe>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-bold text-base text-brand-cream mb-2 line-clamp-2">{latestContent.video.title}</h3>
                      <div className="text-[10px] font-bold text-brand-cream/20 uppercase tracking-wider mt-auto flex justify-between items-center">
                        <span className="bg-brand-accent/10 text-brand-accent px-2 py-1 rounded">🎥 Skrót</span>
                        <span>{latestContent.video.date}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-brand-cream/20 min-h-[220px]">
                    <span className="text-3xl mb-2 opacity-30">🎥</span>
                    <span className="font-medium text-sm">Brak wideo</span>
                  </div>
                )}

                {/* Stream */}
                {latestContent.stream ? (
                  <div className="glass-card rounded-2xl overflow-hidden flex flex-col border-red-500/20 group">
                    <div className="relative pt-[56.25%] bg-black/40 border-b border-red-500/30">
                      <iframe className="absolute top-0 left-0 w-full h-full" src={latestContent.stream.embedUrl} title={latestContent.stream.title} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen></iframe>
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg animate-pulse uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span> Live
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-black text-base text-red-400 mb-2 line-clamp-2">{latestContent.stream.title}</h3>
                      <div className="text-[10px] font-bold text-red-400/40 uppercase tracking-wider mt-auto flex justify-between items-center">
                        <span>🔴 Transmisja</span>
                        <span>{latestContent.stream.date}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-brand-cream/20 min-h-[220px]">
                    <span className="text-3xl mb-2 opacity-30">🔴</span>
                    <span className="font-medium text-sm">Brak transmisji</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="w-full max-w-4xl">
              <div className="glass-card rounded-2xl p-6 flex flex-wrap justify-around gap-6 text-center">
                {[
                  { value: '16', label: 'Województw' },
                  { value: '100+', label: 'Lig' },
                  { value: '24/7', label: 'Automatyzacja' },
                  { value: 'LIVE', label: 'Aktualizacje' }
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col items-center animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                    <span className="text-2xl sm:text-3xl font-black text-brand-accent">{stat.value}</span>
                    <span className="text-[10px] sm:text-xs text-brand-cream/25 font-bold uppercase tracking-widest mt-1">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== LEAGUES ===== */}
        {currentView === 'leagues' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="glass-card p-6 sm:p-8 rounded-2xl mb-8 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="neon-dot"></div>
                <h2 className="text-xs font-bold text-brand-accent/60 uppercase tracking-[0.2em]">Wybór Rozgrywek</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-brand-cream/25 mb-2 ml-1 uppercase tracking-widest">Region</label>
                  <select value={selectedProvince} onChange={handleProvinceChange} className="select-futuristic">
                    {Object.keys(LEAGUE_STRUCTURE).map(prov => <option key={prov} value={prov}>{prov === "Cała Polska" ? "🇵🇱" : "📍"} {prov}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-brand-cream/25 mb-2 ml-1 uppercase tracking-widest">Szczebel</label>
                  <select value={selectedLevel} onChange={handleLevelChange} className="select-futuristic">
                    {Object.keys(LEAGUE_STRUCTURE[selectedProvince]).map(lvl => <option key={lvl} value={lvl}>🏆 {lvl}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-brand-cream/25 mb-2 ml-1 uppercase tracking-widest">Liga / Grupa</label>
                  <select value={currentLeague} onChange={(e) => setCurrentLeague(e.target.value)} className="select-futuristic border-brand-accent/20">
                    {LEAGUE_STRUCTURE[selectedProvince][selectedLevel].map(league => <option key={league.id} value={league.id}>{league.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

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
        )}
        
        {currentView === 'news' && <PublicNews />}
        {currentView === 'cms' && <CmsPanel />}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="mt-auto border-t border-brand-accent/8 py-10 text-center">
        <img src="/Group_2.jpg" alt="footer-logo" className="h-12 w-12 mb-4 mx-auto rounded-xl opacity-40" />
        <p className="font-black text-lg mb-1 text-brand-cream/60">meczomat<span className="text-brand-accent/60">.pl</span></p>
        <p className="text-brand-cream/15 text-xs">© {new Date().getFullYear()} — Wszystkie dane pobierane automatycznie.</p>
      </footer>
    </div>
  );
}

export default App;