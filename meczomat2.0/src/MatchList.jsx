import React, { useState, useEffect } from 'react';

const MatchList = ({ leagueId }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pobierzMecze = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/mecze?liga=${leagueId}`);
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

  return (
    <div className="mt-6 animate-slide-up stagger-3">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-brand-accent/6">
          <h2 className="text-lg md:text-xl font-black text-brand-cream flex items-center gap-2">
            <span className="text-2xl">📅</span> Terminarz i Wyniki
          </h2>
        </div>
        
        <div className="p-4 sm:p-5 space-y-2">
          {matches.map((match, idx) => (
            <div 
              key={match.id} 
              className="match-card glass-surface rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between"
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              <div className="text-center sm:text-left mb-3 sm:mb-0 w-full sm:w-1/4">
                <div className="text-sm font-bold text-brand-cream/60">{match.dataWizualna}</div>
                <div className="text-[10px] text-brand-cream/20">{match.godzina}</div>
                {match.status === 'Nierozegrany' && (
                  <span className="inline-block mt-1 text-[9px] bg-brand-cream/5 text-brand-cream/25 px-2 py-0.5 rounded uppercase font-semibold tracking-wider border border-brand-cream/5">Planowany</span>
                )}
                {match.status === 'Zakończony' && (
                  <span className="inline-block mt-1 text-[9px] bg-brand-accent/8 text-brand-accent/60 px-2 py-0.5 rounded uppercase font-semibold tracking-wider">Koniec</span>
                )}
              </div>

              <div className="flex items-center justify-center w-full sm:w-2/4">
                <div className="flex items-center justify-end w-1/3">
                  <span className="font-semibold text-brand-cream/60 text-sm mr-3 text-right">{match.gospodarz.nazwa}</span>
                  {match.gospodarz.herb ? (
                    <img src={match.gospodarz.herb} alt={match.gospodarz.nazwa} className="w-7 h-7 object-contain" />
                  ) : (
                    <div className="w-7 h-7 bg-brand-accent/5 rounded-full flex-shrink-0 border border-brand-accent/10"></div>
                  )}
                </div>

                <div className="w-1/3 flex justify-center px-3">
                  {match.status === 'Zakończony' && match.wynikGospodarz !== null ? (
                    <div className="score-badge text-white font-black text-lg px-3.5 py-1 rounded-md tracking-widest">
                      {match.wynikGospodarz}:{match.wynikGosc}
                    </div>
                  ) : (
                    <div className="bg-brand-cream/5 text-brand-cream/15 font-bold text-sm px-3 py-1 rounded-md border border-brand-cream/5">vs</div>
                  )}
                </div>

                <div className="flex items-center justify-start w-1/3">
                  {match.gosc.herb ? (
                    <img src={match.gosc.herb} alt={match.gosc.nazwa} className="w-7 h-7 object-contain" />
                  ) : (
                    <div className="w-7 h-7 bg-brand-accent/5 rounded-full flex-shrink-0 border border-brand-accent/10"></div>
                  )}
                  <span className="font-semibold text-brand-cream/60 text-sm ml-3 text-left">{match.gosc.nazwa}</span>
                </div>
              </div>

              <div className="hidden sm:block sm:w-1/4 text-right">
                <div className="text-[10px] text-brand-cream/15 uppercase tracking-wider font-semibold">Kolejka {match.kolejka}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchList;