import React, { useState, useEffect } from 'react';
import API from './api';

const TeamSearch = ({ 
  leagueId, 
  favoriteTeam, 
  toggleFavorite, 
  targetTeamProfile, 
  setTargetTeamProfile,
  globalTeams,           // <--- Lista wszystkich drużyn
  changeLeagueAndTeam    // <--- Funkcja do zmiany filtrów ligowych
}) => {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [fbClub, setFbClub] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/api/mecze?liga=${leagueId}`);
        const meczeData = await res.json();
        setMatches(meczeData);
      } catch (error) {
        console.error("Błąd pobierania danych wyszukiwarki:", error);
      }
    };
    fetchData();

    if (!targetTeamProfile) {
      setSelectedTeam(null);
      setSearchTerm('');
      setFbClub(null);
    }
  }, [leagueId]);

  useEffect(() => {
    if (targetTeamProfile) {
      setSelectedTeam(targetTeamProfile);
      setTargetTeamProfile(null); 
    }
  }, [targetTeamProfile, setTargetTeamProfile]);

  // Fetch FB page for selected team
  useEffect(() => {
    if (!selectedTeam) { setFbClub(null); return; }
    fetch(`${API}/api/club-facebook`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const match = data.find(c => c.clubName.toLowerCase() === selectedTeam.toLowerCase())
          || data.find(c => selectedTeam.toLowerCase().includes(c.clubName.toLowerCase()))
          || data.find(c => c.clubName.toLowerCase().includes(selectedTeam.toLowerCase()));
        setFbClub(match || null);
      })
      .catch(() => {});
  }, [selectedTeam]);

  // Teraz wyszukiwarka filtruje globalny słownik (globalTeams)!
  const filteredTeams = searchTerm
    ? globalTeams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const teamMatches = selectedTeam
    ? matches.filter(m => m.gospodarz.nazwa === selectedTeam || m.gosc.nazwa === selectedTeam)
    : [];

  const completedMatches = teamMatches.filter(m => m.status === 'Zakończony');
  const last5Matches = [...completedMatches].reverse().slice(0, 5);

  const getMatchResult = (match) => {
    const isHost = match.gospodarz.nazwa === selectedTeam;
    const goalsScored = isHost ? parseInt(match.wynikGospodarz) : parseInt(match.wynikGosc);
    const goalsConceded = isHost ? parseInt(match.wynikGosc) : parseInt(match.wynikGospodarz);

    if (goalsScored > goalsConceded) return { text: 'Z', color: 'bg-green-500' };
    if (goalsScored === goalsConceded) return { text: 'R', color: 'bg-yellow-500' };
    return { text: 'P', color: 'bg-red-500' };
  };

  return (
    <div className="w-full mb-10">
      
      {/* SEKCJA WYSZUKIWARKI */}
      <div className="glass-card p-5 rounded-2xl relative animate-slide-up z-20">
        <h2 className="text-lg font-bold text-brand-cream mb-4 flex items-center gap-2">🔍 Wyszukaj klub w lidze</h2>
        <input
          type="text"
          placeholder="Wpisz nazwę klubu (np. Górnik, Wisła, Śląsk)..."
          aria-label="Wyszukiwarka klubów piłkarskich w niższych ligach"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-futuristic w-full text-base"
        />
        
        {filteredTeams.length > 0 && (
          <ul className="absolute z-30 w-[calc(100%-2.5rem)] mt-2 glass-surface rounded-lg shadow-2xl max-h-56 overflow-y-auto left-5 border border-brand-accent/10">
            {filteredTeams.map((team, idx) => (
              <li key={idx}
                onClick={() => {
                  setSearchTerm('');
                  changeLeagueAndTeam(team.province, team.level, team.leagueId, team.name);
                }}
                className="p-3.5 hover:bg-brand-accent/10 cursor-pointer font-bold text-brand-cream/80 border-b border-brand-accent/5 last:border-b-0 transition-colors text-sm flex justify-between items-center">
                <span>{team.name}</span>
                <span className="text-[10px] font-bold text-brand-cream/30 bg-brand-accent/5 px-2 py-0.5 rounded border border-brand-accent/10">
                  {team.province} • {team.level}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SEKCJA WYNIKÓW */}
      {selectedTeam && (
        <div className="mt-6 animate-slide-up glass-card rounded-2xl overflow-hidden">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-brand-accent/6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/5 to-transparent pointer-events-none"></div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-brand-cream relative z-10">{selectedTeam}</h1>
            
            <button 
              onClick={() => toggleFavorite(selectedTeam, leagueId)}
              className={`relative z-10 px-4 py-2 rounded-lg font-bold transition-all duration-300 border flex items-center gap-2 text-sm ${
                favoriteTeam === selectedTeam 
                ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.1)]" 
                : "border-brand-cream/10 text-brand-cream/40 hover:border-brand-accent/30 hover:text-brand-accent"
              }`}
            >
              <span className="text-lg">{favoriteTeam === selectedTeam ? "★" : "☆"}</span>
              {favoriteTeam === selectedTeam ? "Obserwujesz" : "Obserwuj klub"}
            </button>
          </div>

          <div className="p-5 sm:p-6">
            
            {/* FORMA */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-brand-cream/25 uppercase tracking-widest mb-4 flex items-center gap-2">
                📊 Forma zespołu
              </h3>
              {last5Matches.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  {last5Matches.map((match, idx) => {
                    const result = getMatchResult(match);
                    return (
                      <div key={match.id} className="flex-1 glass-surface rounded-xl p-3.5 flex flex-col items-center justify-center relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                        <div className={`absolute top-0 w-full h-[2px] ${result.color}`}></div>
                        <span className={`text-white font-black w-9 h-9 rounded-full flex items-center justify-center mb-2 ${result.color} shadow-lg text-sm`}>
                          {result.text}
                        </span>
                        <div className="text-[10px] text-brand-cream/20 font-bold uppercase tracking-widest text-center mb-1">
                          {match.gospodarz.nazwa === selectedTeam ? 'Dom' : 'Wyjazd'}
                        </div>
                        <div className="font-black text-xl text-brand-cream">
                          {match.wynikGospodarz}:{match.wynikGosc}
                        </div>
                        <div className="text-[10px] text-brand-cream/20 font-medium text-center mt-1 w-full truncate px-1" title={match.gospodarz.nazwa === selectedTeam ? match.gosc.nazwa : match.gospodarz.nazwa}>
                          vs {match.gospodarz.nazwa === selectedTeam ? match.gosc.nazwa : match.gospodarz.nazwa}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-brand-cream/20 font-medium p-4 glass-surface rounded-lg text-center text-sm">Brak wyników do wyświetlenia dla bieżącej ligi.</p>
              )}
            </div>

            <div className="neon-line my-6"></div>

            {/* TERMINARZ */}
            {(() => {
              const PL_MONTHS = { sty:0,lut:1,mar:2,kwi:3,maj:4,cze:5,lip:6,sie:7,wrz:8,paz:9,lis:10,gru:11 };
              const parseDate = (str) => {
                if (!str) return new Date(0);
                const d = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
                if (d) return new Date(+d[3], +d[2]-1, +d[1]);
                const p = str.match(/^(\d{1,2})\s+([a-zA-Ząę]+)\s+(\d{4})/i);
                if (p) { const m = PL_MONTHS[p[2].toLowerCase().slice(0,3)]; if (m!==undefined) return new Date(+p[3],m,+p[1]); }
                return new Date(str);
              };
              const upcoming = [...teamMatches].filter(m => m.status !== 'Zakończony').sort((a,b) => parseDate(a.dataWizualna)-parseDate(b.dataWizualna));
              const played   = [...teamMatches].filter(m => m.status === 'Zakończony').sort((a,b) => parseDate(b.dataWizualna)-parseDate(a.dataWizualna));

              const MatchRow = ({ match }) => (
                <div className="match-card flex items-center justify-between p-3.5 rounded-lg text-sm glass-surface">
                  <div className="w-1/4 text-brand-cream/20 font-bold text-[10px] uppercase tracking-wider">
                    {match.dataWizualna}<br/>
                    <span className="text-brand-accent/50">Kol. {match.kolejka}</span>
                  </div>
                  <div className="w-2/4 flex justify-between items-center px-2 sm:px-4 font-medium">
                    <span className={`w-2/5 text-right truncate text-xs ${match.gospodarz.nazwa === selectedTeam ? 'font-black text-brand-accent' : 'text-brand-cream/40'}`}>{match.gospodarz.nazwa}</span>
                    <span className={`w-1/5 text-center mx-2 px-2.5 py-1 rounded-md font-black text-white text-xs ${match.status === 'Zakończony' ? 'score-badge' : 'bg-brand-cream/5 text-brand-cream/15'}`}>
                      {match.status === 'Zakończony' ? `${match.wynikGospodarz}:${match.wynikGosc}` : '-:-'}
                    </span>
                    <span className={`w-2/5 text-left truncate text-xs ${match.gosc.nazwa === selectedTeam ? 'font-black text-brand-accent' : 'text-brand-cream/40'}`}>{match.gosc.nazwa}</span>
                  </div>
                </div>
              );

              return teamMatches.length === 0 ? (
                <p className="text-center text-brand-cream/20 text-sm">Brak meczów w aktualnie wybranej lidze.</p>
              ) : (
                <div className="space-y-6">
                  {upcoming.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-brand-cream/25 uppercase tracking-widest mb-3 flex items-center gap-2">
                        📅 Nadchodzące mecze <span className="text-[10px] bg-brand-cream/5 text-brand-cream/20 px-2 py-0.5 rounded-full">{upcoming.length}</span>
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {upcoming.map(m => <MatchRow key={m.id} match={m} />)}
                      </div>
                    </div>
                  )}
                  {played.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-brand-cream/25 uppercase tracking-widest mb-3 flex items-center gap-2">
                        ✅ Rozegrane mecze <span className="text-[10px] bg-brand-accent/10 text-brand-accent/50 px-2 py-0.5 rounded-full">{played.length}</span>
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {played.map(m => <MatchRow key={m.id} match={m} />)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* FACEBOOK */}
            {fbClub && (
              <>
                <div className="neon-line my-6"></div>
                <div>
                  <h3 className="text-sm font-bold text-brand-cream/25 uppercase tracking-widest mb-4">📘 Strona na Facebooku</h3>
                  <div style={{ background: 'var(--c-surface,#12201a)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '0.85rem 1.1rem', background: 'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(37,99,235,0.06))', borderBottom: '1px solid rgba(59,130,246,0.14)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1877f2,#0c52a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>📘</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: 'var(--c-text,#edf2ed)', fontSize: '0.92rem' }}>{fbClub.clubName}</div>
                        <div style={{ fontSize: '0.65rem', color: '#60a5fa', marginTop: 1 }}>{fbClub.league}{fbClub.province ? ` · ${fbClub.province}` : ''}</div>
                      </div>
                      <a href={fbClub.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.68rem', fontWeight: 700, background: 'rgba(24,119,242,0.15)', color: '#93c5fd', padding: '4px 10px', borderRadius: 16, border: '1px solid rgba(59,130,246,0.3)', textDecoration: 'none' }}>Otwórz →</a>
                    </div>
                    <iframe
                      src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(fbClub.facebookUrl)}&tabs=timeline&width=500&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`}
                      width="100%" height="600"
                      style={{ border: 'none', display: 'block' }}
                      scrolling="no" frameBorder="0" allowFullScreen
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      title={`Facebook - ${fbClub.clubName}`}
                      loading="lazy"
                    />
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSearch;