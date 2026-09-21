import React, { useState, useEffect } from 'react';
import API from './api';

const PL_MONTHS = { sty:0,lut:1,mar:2,kwi:3,maj:4,cze:5,lip:6,sie:7,wrz:8,paz:9,'paź':9,lis:10,gru:11 };
const PL_MONTH_FULL = { stycznia:0,lutego:1,marca:2,kwietnia:3,maja:4,czerwca:5,lipca:6,sierpnia:7,września:8,października:9,listopada:10,grudnia:11 };

// Parses "DD.MM.YYYY", "DD Mmm YYYY", or "DD MonthName" (no year) into a Date
const parseDate = (str) => {
  if (!str) return new Date(0);
  const dotMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotMatch) return new Date(+dotMatch[3], +dotMatch[2] - 1, +dotMatch[1]);
  const plFull = str.match(/^(\d{1,2})\s+([a-zA-Ząęółśźćń]+)\s+(\d{4})/i);
  if (plFull) {
    const m = PL_MONTHS[plFull[2].toLowerCase().slice(0, 3)] ?? PL_MONTH_FULL[plFull[2].toLowerCase()];
    if (m !== undefined) return new Date(+plFull[3], m, +plFull[1]);
  }
  // "DD MonthName" without year — use current year as base
  const plNoYear = str.match(/^(\d{1,2})\s+([a-zA-Ząęółśźćń]+)/i);
  if (plNoYear) {
    const key = plNoYear[2].toLowerCase();
    const m = PL_MONTHS[key.slice(0, 3)] ?? PL_MONTH_FULL[key];
    if (m !== undefined) return new Date(new Date().getFullYear(), m, +plNoYear[1]);
  }
  return new Date(str);
};

const MatchRow = ({ match, idx }) => (
  <div
    className="match-card rounded-2xl border border-brand-cream/6 bg-brand-cream/[0.02] p-3.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-300 hover:border-brand-accent/15 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    style={{ animationDelay: `${idx * 0.03}s` }}
  >
    <div className="text-center sm:text-left w-full sm:w-[26%]">
      <div className="text-sm font-black text-brand-cream/90">{match.dataWizualna}</div>
      <div className="text-[10px] text-brand-cream/30 mt-0.5">{match.godzina}</div>
      {match.status === 'Nierozegrany' && (
        <span className="inline-block mt-1.5 text-[9px] bg-brand-cream/5 text-brand-cream/30 px-2 py-0.5 rounded-full uppercase tracking-[0.12em] font-semibold border border-brand-cream/8">Planowany</span>
      )}
      {match.status === 'Zakończony' && (
        <span className="inline-block mt-1.5 text-[9px] bg-brand-accent/8 text-brand-accent/75 px-2 py-0.5 rounded-full uppercase tracking-[0.12em] font-semibold">Koniec</span>
      )}
    </div>

    <div className="flex flex-col gap-2.5 w-full sm:flex-row sm:items-center sm:justify-center sm:w-[48%]">
      <div className="flex items-center justify-between gap-2 w-full sm:justify-end sm:w-[42%] sm:min-w-0">
        <span className="font-semibold text-brand-cream/80 text-[13px] text-right break-words leading-[1.2] min-w-0 flex-1 sm:mr-2">{match.gospodarz.nazwa}</span>
        {match.gospodarz.herb
          ? <img src={match.gospodarz.herb} alt={match.gospodarz.nazwa} className="w-7 h-7 object-contain flex-shrink-0" />
          : <div className="w-7 h-7 bg-brand-accent/6 rounded-full flex-shrink-0 border border-brand-accent/10" />}
      </div>

      <div className="flex justify-center w-full sm:w-[16%] sm:px-1">
        {match.status === 'Zakończony' && match.wynikGospodarz !== null ? (
          <div className="score-badge text-white font-black text-lg px-3 py-1.5 rounded-xl tracking-[0.08em] shadow-[0_0_18px_rgba(74,222,128,0.2)]">
            {match.wynikGospodarz}:{match.wynikGosc}
          </div>
        ) : (
          <div className="bg-brand-cream/5 text-brand-cream/20 font-bold text-sm px-3 py-1.5 rounded-xl border border-brand-cream/8">vs</div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 w-full sm:justify-start sm:w-[42%] sm:min-w-0">
        {match.gosc.herb
          ? <img src={match.gosc.herb} alt={match.gosc.nazwa} className="w-7 h-7 object-contain flex-shrink-0" />
          : <div className="w-7 h-7 bg-brand-accent/6 rounded-full flex-shrink-0 border border-brand-accent/10" />}
        <span className="font-semibold text-brand-cream/80 text-[13px] text-left break-words leading-[1.2] min-w-0 flex-1 sm:ml-2">{match.gosc.nazwa}</span>
      </div>
    </div>

    <div className="hidden sm:block sm:w-[12%] text-right">
      <div className="text-[10px] text-brand-cream/25 uppercase tracking-[0.16em] font-bold">Kolejka {match.kolejka}</div>
    </div>
  </div>
);

const ShowMore = ({ shown, total, onMore }) => {
  if (shown >= total) return null;
  const left = total - shown;
  return (
    <button onClick={onMore} className="w-full mt-3 py-2.5 rounded-lg text-xs font-bold text-brand-cream/40 border border-brand-cream/8 bg-brand-cream/3 hover:bg-brand-cream/6 transition-colors">
      Pokaż więcej ({Math.min(10, left)} z {left} pozostałych) ›
    </button>
  );
};

const MatchList = ({ leagueId }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlayed, setShowPlayed] = useState(5);
  const [showUpcoming, setShowUpcoming] = useState(5);

  useEffect(() => {
    const pobierzMecze = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API}/api/mecze?liga=${leagueId}`);
        const data = await response.json();
        setMatches(data);
      } catch (error) {
        console.error("Błąd pobierania meczów:", error);
      } finally {
        setLoading(false);
      }
    };
    pobierzMecze();
  }, [leagueId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center p-14 glass-card rounded-2xl mt-6">
        <div className="w-9 h-9 border-3 border-brand-accent/10 border-t-brand-accent rounded-full animate-spin mb-3"></div>
        <span className="text-brand-cream/25 font-bold text-sm animate-pulse">Ładowanie terminarza...</span>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-10 mt-6 text-center text-brand-cream/25 font-medium">
        Brak zaplanowanych meczów dla wybranej ligi.
      </div>
    );
  }

  const today = new Date(); today.setHours(0,0,0,0);

  // Played: most recent first (closest past date at top)
  const played = matches
    .filter(m => m.status === 'Zakończony')
    .sort((a, b) => {
      const diff = parseDate(b.dataWizualna) - parseDate(a.dataWizualna);
      if (diff !== 0) return diff;
      return (+b.kolejka || 0) - (+a.kolejka || 0);
    });

  // Upcoming: soonest first (closest future date at top)
  const upcoming = matches
    .filter(m => m.status !== 'Zakończony')
    .sort((a, b) => parseDate(a.dataWizualna) - parseDate(b.dataWizualna));

  return (
    <div className="mt-6 animate-slide-up stagger-3 space-y-6">

      {upcoming.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-brand-accent/6">
            <h2 className="text-lg md:text-xl font-black text-brand-cream flex items-center gap-2">
              <span className="text-2xl">📅</span> Nadchodzące mecze
              <span className="ml-2 text-xs font-semibold bg-brand-cream/5 text-brand-cream/30 px-2.5 py-0.5 rounded-full">{upcoming.length}</span>
            </h2>
          </div>
          <div className="p-4 sm:p-5 space-y-2 scroll-smooth-soft">
            {upcoming.slice(0, showUpcoming).map((match, idx) => <MatchRow key={match.id} match={match} idx={idx} />)}
            <ShowMore shown={showUpcoming} total={upcoming.length} onMore={() => setShowUpcoming(n => n + 10)} />
          </div>
        </div>
      )}

      {played.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-brand-accent/6">
            <h2 className="text-lg md:text-xl font-black text-brand-cream flex items-center gap-2">
              <span className="text-2xl">✅</span> Rozegrane mecze
              <span className="ml-2 text-xs font-semibold bg-brand-accent/10 text-brand-accent/60 px-2.5 py-0.5 rounded-full">{played.length}</span>
            </h2>
          </div>
          <div className="p-4 sm:p-5 space-y-2 scroll-smooth-soft">
            {played.slice(0, showPlayed).map((match, idx) => <MatchRow key={match.id} match={match} idx={idx} />)}
            <ShowMore shown={showPlayed} total={played.length} onMore={() => setShowPlayed(n => n + 10)} />
          </div>
        </div>
      )}

    </div>
  );
};

export default MatchList;