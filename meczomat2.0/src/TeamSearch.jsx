import React, { useState, useEffect } from 'react';
import API from './api';
import { getCachedLeague, fetchLeague } from './leagueData';
import { splitTeamMatches, matchResultFor } from './seo/shared';
import TeamLink from './TeamLink';

// --- WYSZUKIWARKA KLUBÓW (wybór przenosi na podstronę drużyny) ---
const TeamSearch = ({ globalTeams, onPickTeam }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeams = searchTerm
    ? globalTeams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <div className="w-full mb-10">
      <div className="glass-card p-5 rounded-2xl relative animate-slide-up z-20">
        <h2 className="text-lg font-bold text-brand-cream mb-4 flex items-center gap-2">🔍 Wyszukaj klub</h2>
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
            {filteredTeams.map((team) => (
              <li key={team.slug}
                onClick={() => { setSearchTerm(''); onPickTeam(team); }}
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
    </div>
  );
};

const RESULT_COLOR = { Z: 'bg-green-500', R: 'bg-yellow-500', P: 'bg-red-500' };

// --- PROFIL DRUŻYNY (podstrona /druzyna/:slug) ---
export const TeamProfile = ({ teamName, leagueId, favoriteTeam, toggleFavorite }) => {
  const [fetched, setFetched] = useState(null); // { leagueId, data }
  const [fb, setFb] = useState(null); // { teamName, club }
  const cached = getCachedLeague('mecze', leagueId);
  const matches = (fetched?.leagueId === leagueId && fetched.data) || cached || [];

  useEffect(() => {
    let cancelled = false;
    fetchLeague('mecze', leagueId)
      .catch(() => null)
      .then(data => { if (!cancelled) setFetched({ leagueId, data: Array.isArray(data) ? data : null }); });
    return () => { cancelled = true; };
  }, [leagueId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/club-facebook`)
      .then(r => r.json())
      .then(data => {
        if (cancelled || !Array.isArray(data)) return;
        const lower = teamName.toLowerCase();
        const match = data.find(c => c.clubName.toLowerCase() === lower)
          || data.find(c => lower.includes(c.clubName.toLowerCase()))
          || data.find(c => c.clubName.toLowerCase().includes(lower));
        setFb({ teamName, club: match || null });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [teamName]);

  const fbClub = fb?.teamName === teamName ? fb.club : null;
  const { played, upcoming } = splitTeamMatches(matches, teamName);
  const last5Matches = played.slice(0, 5);
  const teamMatchesCount = played.length + upcoming.length;

  const MatchRow = ({ match }) => (
    <div className="match-card flex flex-col gap-2.5 rounded-2xl border border-brand-cream/6 bg-brand-cream/[0.02] p-3.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-300 hover:border-brand-accent/15 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full text-brand-cream/20 font-bold text-[10px] uppercase tracking-[0.14em] sm:w-[24%]">
        <div className="text-brand-cream/80 text-[12px] font-black tracking-[0.02em]">{match.dataWizualna}</div>
        <span className="text-brand-accent/60 mt-1 inline-block">Kol. {match.kolejka}</span>
      </div>
      <div className="w-full flex items-center justify-between gap-2 px-0 sm:w-[66%] sm:px-2 sm:gap-3 font-medium">
        <TeamLink name={match.gospodarz.nazwa} leagueId={leagueId} className={`flex-1 min-w-0 text-right break-words leading-[1.2] text-[13px] hover:underline ${match.gospodarz.nazwa === teamName ? 'font-black text-brand-accent' : 'text-brand-cream/60'}`} />
        <span className={`shrink-0 text-center px-2.5 py-1.5 rounded-xl font-black text-white text-xs ${match.status === 'Zakończony' ? 'score-badge' : 'bg-brand-cream/5 text-brand-cream/20'}`}>
          {match.status === 'Zakończony' ? `${match.wynikGospodarz}:${match.wynikGosc}` : '-:-'}
        </span>
        <TeamLink name={match.gosc.nazwa} leagueId={leagueId} className={`flex-1 min-w-0 text-left break-words leading-[1.2] text-[13px] hover:underline ${match.gosc.nazwa === teamName ? 'font-black text-brand-accent' : 'text-brand-cream/60'}`} />
      </div>
    </div>
  );

  return (
    <div className="mb-10 animate-slide-up glass-card rounded-2xl overflow-hidden">
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-brand-accent/6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/5 to-transparent pointer-events-none"></div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-brand-cream relative z-10">{teamName}</h1>

        <button
          onClick={() => toggleFavorite(teamName, leagueId)}
          className={`relative z-10 px-4 py-2 rounded-lg font-bold transition-all duration-300 border flex items-center gap-2 text-sm ${
            favoriteTeam === teamName
            ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.1)]"
            : "border-brand-cream/10 text-brand-cream/40 hover:border-brand-accent/30 hover:text-brand-accent"
          }`}
        >
          <span className="text-lg">{favoriteTeam === teamName ? "★" : "☆"}</span>
          {favoriteTeam === teamName ? "Obserwujesz" : "Obserwuj klub"}
        </button>
      </div>

      <div className="p-5 sm:p-6">

        {/* FORMA */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-brand-cream/25 uppercase tracking-widest mb-4 flex items-center gap-2">
            📊 Forma zespołu
          </h2>
          {last5Matches.length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-3">
              {last5Matches.map((match, idx) => {
                const result = matchResultFor(match, teamName);
                const color = RESULT_COLOR[result];
                const opponent = match.gospodarz.nazwa === teamName ? match.gosc.nazwa : match.gospodarz.nazwa;
                return (
                  <div key={match.id} className="flex-1 glass-surface rounded-xl p-3.5 flex flex-col items-center justify-center relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                    <div className={`absolute top-0 w-full h-[2px] ${color}`}></div>
                    <span className={`text-white font-black w-9 h-9 rounded-full flex items-center justify-center mb-2 ${color} shadow-lg text-sm`}>
                      {result}
                    </span>
                    <div className="text-[10px] text-brand-cream/20 font-bold uppercase tracking-widest text-center mb-1">
                      {match.gospodarz.nazwa === teamName ? 'Dom' : 'Wyjazd'}
                    </div>
                    <div className="font-black text-xl text-brand-cream">
                      {match.wynikGospodarz}:{match.wynikGosc}
                    </div>
                    <div className="text-[10px] text-brand-cream/20 font-medium text-center mt-1 w-full truncate px-1" title={opponent}>
                      vs {opponent}
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
        {teamMatchesCount === 0 ? (
          <p className="text-center text-brand-cream/20 text-sm">Brak meczów w aktualnie wybranej lidze.</p>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-brand-cream/25 uppercase tracking-widest mb-3 flex items-center gap-2">
                  📅 Terminarz {teamName} <span className="text-[10px] bg-brand-cream/5 text-brand-cream/20 px-2 py-0.5 rounded-full">{upcoming.length}</span>
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scroll-smooth-soft">
                  {upcoming.map(m => <MatchRow key={m.id} match={m} />)}
                </div>
              </div>
            )}
            {played.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-brand-cream/25 uppercase tracking-widest mb-3 flex items-center gap-2">
                  ✅ Wyniki {teamName} <span className="text-[10px] bg-brand-accent/10 text-brand-accent/50 px-2 py-0.5 rounded-full">{played.length}</span>
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scroll-smooth-soft">
                  {played.map(m => <MatchRow key={m.id} match={m} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FACEBOOK */}
        {fbClub && (
          <>
            <div className="neon-line my-6"></div>
            <div>
              <h2 className="text-sm font-bold text-brand-cream/25 uppercase tracking-widest mb-4">📘 Strona na Facebooku</h2>
              <div style={{ background: 'var(--c-surface,#12201a)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.25)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(24,119,242,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)'; }}
              >
                <div style={{ padding: '0.85rem 1.1rem', background: 'linear-gradient(135deg,rgba(24,119,242,0.18),rgba(37,99,235,0.08))', borderBottom: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1877f2,#0c52a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 12px rgba(24,119,242,0.45)', fontWeight: 900, fontSize: '1.05rem', color: '#fff', fontFamily: 'Georgia,serif' }}>f</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: 'var(--c-text,#edf2ed)', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fbClub.clubName}</div>
                    <div style={{ fontSize: '0.65rem', color: '#60a5fa', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', flexShrink: 0 }} />
                      {fbClub.league}{fbClub.province ? ` · ${fbClub.province}` : ''}
                    </div>
                  </div>
                  <a href={fbClub.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', fontWeight: 700, background: 'linear-gradient(135deg,#1877f2,#0c52a3)', color: '#fff', padding: '5px 13px', borderRadius: 20, textDecoration: 'none', flexShrink: 0, boxShadow: '0 2px 10px rgba(24,119,242,0.4)' }}>Otwórz →</a>
                </div>
                <div style={{ position: 'relative', height: 480, overflow: 'hidden' }}>
                  <iframe
                    src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(fbClub.facebookUrl)}&tabs=timeline&width=500&height=540&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&appId`}
                    width="100%" height="540"
                    style={{ border: 'none', display: 'block' }}
                    scrolling="no" frameBorder="0" allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    title={`Facebook - ${fbClub.clubName}`}
                    loading="lazy"
                  />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to top, var(--c-surface, #12201a) 10%, transparent)', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default TeamSearch;
