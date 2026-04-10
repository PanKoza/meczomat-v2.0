import React, { useState, useEffect } from 'react';

const LeagueTable = ({ leagueId, favoriteTeam, toggleFavorite }) => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pobierzTabele = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://meczomat-api.onrender.com/api/tabela?liga=${leagueId}`);
        const data = await response.json();
        setTableData(data);
      } catch (error) {
        console.error("Błąd", error);
      } finally {
        setLoading(false);
      }
    };

    pobierzTabele();
  }, [leagueId]); 

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center p-16 glass-card rounded-2xl mt-6">
        <div className="w-10 h-10 border-3 border-brand-accent/10 border-t-brand-accent rounded-full animate-spin mb-4"></div>
        <span className="text-sm font-bold text-brand-cream/25 animate-pulse uppercase tracking-widest">Pobieranie tabeli...</span>
      </div>
    );
  }

  return (
    <div className="w-full glass-card rounded-2xl mt-6 overflow-hidden animate-slide-up stagger-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 sm:p-6 border-b border-brand-accent/6 gap-3">
        <h2 className="text-lg md:text-xl font-black text-brand-cream flex items-center gap-2">
          <span className="text-2xl">🏆</span> Aktualna Tabela
        </h2>
        <span className="text-[10px] bg-brand-accent/8 text-brand-accent/60 px-3 py-1.5 rounded-md font-bold uppercase tracking-widest border border-brand-accent/10">
          Sezon 25/26
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[10px] text-brand-accent/40 uppercase tracking-widest">
              <th className="px-4 py-4 text-center w-14">Lp.</th>
              <th className="px-4 py-4">Klub</th>
              <th className="px-3 py-4 text-center" title="Rozegrane mecze">M</th>
              <th className="px-3 py-4 text-center text-brand-accent font-black" title="Punkty">Pkt</th>
              <th className="px-3 py-4 text-center hidden md:table-cell" title="Zwycięstwa">Z</th>
              <th className="px-3 py-4 text-center hidden md:table-cell" title="Remisy">R</th>
              <th className="px-3 py-4 text-center hidden md:table-cell" title="Porażki">P</th>
              <th className="px-4 py-4 text-center hidden sm:table-cell" title="Bramki">Bramki</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => {
              const isFavorite = row.nazwa === favoriteTeam;
              return (
                <tr 
                  key={row.pozycja} 
                  className={`border-b border-brand-accent/4 transition-all duration-300 hover:bg-brand-accent/5 group
                    ${isFavorite ? 'bg-brand-accent/8 hover:bg-brand-accent/12' : ''}
                    ${row.status === 'Promotion' ? 'border-l-2 border-l-green-500' : ''} 
                    ${row.status === 'Relegation' ? 'border-l-2 border-l-red-500/60' : ''}
                  `}
                  style={{ animationDelay: `${idx * 0.02}s` }}
                >
                  <td className="px-4 py-3.5 text-center font-bold text-brand-cream/20 text-xs">{row.pozycja}.</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center">
                      <button 
                        onClick={() => toggleFavorite(row.nazwa, leagueId)}
                        className={`mr-3 text-lg transition-all duration-300 hover:scale-125 focus:outline-none ${isFavorite ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" : "text-brand-cream/15 hover:text-yellow-400/50"}`}
                      >
                        {isFavorite ? "★" : "☆"}
                      </button>
                      {row.herb ? (
                        <img src={row.herb} alt={`Herb ${row.nazwa}`} className="w-7 h-7 mr-3 object-contain group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="w-7 h-7 mr-3 bg-brand-accent/5 rounded-full flex-shrink-0 border border-brand-accent/10"></div>
                      )}
                      <span className={`whitespace-nowrap text-sm ${isFavorite ? 'font-black text-brand-accent' : 'font-semibold text-brand-cream/70'}`}>{row.nazwa}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center font-medium text-brand-cream/25 text-xs">{row.mecze}</td>
                  <td className="px-3 py-3.5 text-center font-black text-brand-accent text-base">{row.punkty}</td>
                  <td className="px-3 py-3.5 text-center hidden md:table-cell text-green-400/80 font-bold text-xs">{row.zwyciestwa}</td>
                  <td className="px-3 py-3.5 text-center hidden md:table-cell text-brand-cream/20 font-bold text-xs">{row.remisy}</td>
                  <td className="px-3 py-3.5 text-center hidden md:table-cell text-red-400/80 font-bold text-xs">{row.porazki}</td>
                  <td className="px-4 py-3.5 text-center hidden sm:table-cell text-brand-cream/25 font-bold text-xs tracking-wider">{row.bramkiStrzelone}:{row.bramkiStracone}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeagueTable;