import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getCachedLeague, fetchLeague } from './leagueData';

const ROW_H = 30;    // wysokość jednego miejsca w tabeli (zarazem wysokość przycisku obok wykresu)
const PAD_L = 24;    // miejsce na numery pozycji
const PAD_R = 10;
const AXIS_H = 34;   // oś z numerami kolejek
const ROUND_MS = 550; // czas jednej kolejki w animacji przy prędkości 1×
const SPEEDS = [1, 2, 4];
const ACCENT = '#22c55e';
const CREAM = '#edf2ed';
const SURFACE = '#141e18';

const num = v => parseInt(v, 10) || 0;

// Z listy meczów liczymy tabelę po każdej kolejce.
// Kolejność jak w tabeli ligowej: punkty, bilans bramkowy, bramki strzelone.
function buildHistory(matches) {
  const teams = new Set();
  const byRound = new Map();
  for (const m of matches) {
    teams.add(m.gospodarz.nazwa);
    teams.add(m.gosc.nazwa);
    const round = parseInt(m.kolejka, 10);
    if (m.status !== 'Zakończony' || m.wynikGospodarz == null || m.wynikGosc == null || !Number.isFinite(round)) continue;
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round).push(m);
  }

  const rounds = [...byRound.keys()].sort((a, b) => a - b);
  const stats = {};
  teams.forEach(t => { stats[t] = { pkt: 0, gf: 0, ga: 0, m: 0 }; });

  const snapshots = rounds.map(round => {
    for (const m of byRound.get(round)) {
      const h = stats[m.gospodarz.nazwa], a = stats[m.gosc.nazwa];
      const gh = num(m.wynikGospodarz), ga = num(m.wynikGosc);
      h.m++; a.m++;
      h.gf += gh; h.ga += ga;
      a.gf += ga; a.ga += gh;
      if (gh > ga) h.pkt += 3; else if (gh < ga) a.pkt += 3; else { h.pkt++; a.pkt++; }
    }
    const order = [...teams].sort((x, y) =>
      stats[y].pkt - stats[x].pkt ||
      (stats[y].gf - stats[y].ga) - (stats[x].gf - stats[x].ga) ||
      stats[y].gf - stats[x].gf ||
      x.localeCompare(y, 'pl')
    );
    const byTeam = {};
    order.forEach((t, i) => { byTeam[t] = { pos: i + 1, ...stats[t] }; });
    return { round, order, byTeam };
  });

  return { teams: [...teams].sort((a, b) => a.localeCompare(b, 'pl')), snapshots };
}

// Linie między kolejkami to krzywe Béziera o poziomych stycznych.
// Dla ułamka drogi w poziomie (0..1) zwraca ułamek drogi w pionie na tej krzywej.
function easeOnCurve(frac) {
  if (frac <= 0) return 0;
  if (frac >= 1) return 1;
  let lo = 0, hi = 1;
  for (let k = 0; k < 14; k++) {
    const t = (lo + hi) / 2;
    if (1.5 * t * (1 - t) + t * t * t < frac) lo = t; else hi = t;
  }
  const t = (lo + hi) / 2;
  return 3 * t * t - 2 * t * t * t;
}

const SeasonProgress = ({ leagueId, favoriteTeam }) => {
  const [fetched, setFetched] = useState(null); // { leagueId, data }
  const [picked, setPicked] = useState(null);   // { leagueId, team }
  const [hover, setHover] = useState(null);     // { i, team }
  const [anim, setAnim] = useState(null);       // { leagueId, p } — p to pozycja animacji w kolejkach (ułamkowa)
  const [playing, setPlaying] = useState(null); // leagueId, dla którego trwa odtwarzanie
  const [speed, setSpeed] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [width, setWidth] = useState(0);
  const plotRef = useRef(null);
  const pRef = useRef(0);

  const cached = getCachedLeague('mecze', leagueId);
  const matches = (fetched?.leagueId === leagueId && fetched.data) || cached;

  useEffect(() => {
    let cancelled = false;
    fetchLeague('mecze', leagueId)
      .catch(() => null)
      .then(data => { if (!cancelled) setFetched({ leagueId, data: Array.isArray(data) ? data : null }); });
    return () => { cancelled = true; };
  }, [leagueId]);

  const { teams, snapshots } = useMemo(() => buildHistory(matches || []), [matches]);
  const n = snapshots.length;
  const maxI = n - 1;
  const ready = n >= 2;
  const isPlaying = ready && playing === leagueId;

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setWidth(Math.floor(entries[0].contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  // Odtwarzanie sezonu kolejka po kolejce
  useEffect(() => {
    if (!isPlaying) return;
    let raf, prev = null;
    const tick = now => {
      if (prev != null) {
        pRef.current = Math.min(maxI, pRef.current + ((now - prev) * speed) / ROUND_MS);
        setAnim({ leagueId, p: pRef.current });
        if (pRef.current >= maxI) { setPlaying(null); return; }
      }
      prev = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, speed, leagueId, maxI]);

  const paths = useMemo(() => {
    if (!ready || width <= 0) return {};
    const step = (width - PAD_L - PAD_R) / maxI;
    const out = {};
    for (const team of teams) {
      let d = '';
      snapshots.forEach((s, i) => {
        const px = PAD_L + i * step, py = (s.byTeam[team].pos - 0.5) * ROW_H;
        if (i === 0) { d = `M${px},${py}`; return; }
        const prevY = (snapshots[i - 1].byTeam[team].pos - 0.5) * ROW_H;
        const mid = px - step / 2;
        d += ` C${mid},${prevY} ${mid},${py} ${px},${py}`;
      });
      out[team] = d;
    }
    return out;
  }, [ready, width, maxI, teams, snapshots]);

  if (!ready) return null;

  const last = snapshots[maxI];
  const plotH = teams.length * ROW_H;
  const step = width > 0 ? (width - PAD_L - PAD_R) / maxI : 0;
  const x = i => PAD_L + i * step;
  const y = pos => (pos - 0.5) * ROW_H;

  // p — dokąd dotarła animacja; ci — kolejka, której tabelę pokazujemy po prawej
  const p = anim?.leagueId === leagueId ? Math.min(anim.p, maxI) : maxI;
  const ci = Math.round(p);
  const current = snapshots[ci];
  const atEnd = p >= maxI;

  const selected =
    (picked?.leagueId === leagueId && teams.includes(picked.team) && picked.team) ||
    (teams.includes(favoriteTeam) && favoriteTeam) ||
    last.order[0];
  const active = hover && hover.i <= ci && teams.includes(hover.team) ? hover : null;
  const hovered = active && active.team !== selected ? active.team : null;

  // Punkt na czole linii wyróżnionej drużyny
  const fi = Math.min(Math.floor(p), maxI);
  const y0 = y(snapshots[fi].byTeam[selected].pos);
  const y1 = y(snapshots[Math.min(fi + 1, maxI)].byTeam[selected].pos);
  const headY = y0 + (y1 - y0) * easeOnCurve(p - fi);

  const selPositions = snapshots.map(s => s.byTeam[selected].pos);
  const selNow = current.byTeam[selected];

  const goTo = value => {
    pRef.current = value;
    setAnim({ leagueId, p: value });
  };
  const togglePlay = () => {
    if (isPlaying) { setPlaying(null); return; }
    if (atEnd) goTo(0); else pRef.current = p;
    setPlaying(leagueId);
  };
  const pick = team => setPicked({ leagueId, team });
  const selIndex = last.order.indexOf(selected);
  const stepTeam = dir => {
    const next = last.order[selIndex + dir];
    if (next) pick(next);
  };

  const locate = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.max(0, Math.min(ci, Math.round((e.clientX - rect.left - PAD_L) / step)));
    const pos = Math.max(1, Math.min(teams.length, Math.floor((e.clientY - rect.top) / ROW_H) + 1));
    return { i, team: snapshots[i].order[pos - 1] };
  };

  const tickStep = [1, 2, 5, 10].find(s => s * step >= 22) || 10;
  const tip = active && { ...snapshots[active.i].byTeam[active.team], round: snapshots[active.i].round };
  const tipLeft = active ? Math.max(84, Math.min(width - 84, x(active.i))) : 0;
  const tipBelow = tip && tip.pos <= 3;
  const clipId = `season-clip-${leagueId}`;

  return (
    <div className="w-full glass-card rounded-2xl mt-6 overflow-hidden animate-slide-up stagger-2">
      <div className="p-5 sm:p-6 border-b border-brand-accent/6">
        <h2 className="text-lg md:text-xl font-black text-brand-cream flex items-center gap-2">
          <span className="text-2xl">📈</span> Przebieg sezonu
        </h2>
        <p className="text-xs text-brand-cream/35 mt-1">Miejsce w tabeli po każdej kolejce.</p>
      </div>

      {/* wybór drużyny */}
      <div className="px-3 sm:px-5 pt-4">
        {/* wybrana drużyna + przełączanie strzałkami na sąsiednie miejsca */}
        <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/[0.06] p-1.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => stepTeam(-1)}
            disabled={selIndex === 0}
            aria-label="Drużyna wyżej w tabeli"
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-lg text-brand-cream/70 text-xl font-black hover:bg-brand-cream/8 active:scale-95 transition disabled:opacity-20 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
          >‹</button>
          <button
            type="button"
            onClick={() => setPickerOpen(o => !o)}
            aria-expanded={pickerOpen}
            className="flex-1 min-w-0 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-brand-cream/[0.04] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
          >
            <span className="flex items-center justify-center w-8 h-8 flex-shrink-0 rounded-full bg-brand-accent text-brand-dark text-xs font-black">{selNow.pos}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-brand-accent truncate">{selected}</span>
              <span className="block text-[11px] text-brand-cream/50 truncate">
                {selNow.pkt} pkt · bramki {selNow.gf}:{selNow.ga} · najwyżej {Math.min(...selPositions)}., najniżej {Math.max(...selPositions)}.
              </span>
            </span>
            <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-cream/45 flex items-center gap-1`}>
              <span className="hidden sm:inline">Zmień</span>
              <span className={`inline-block transition-transform duration-200 ${pickerOpen ? 'rotate-180' : ''}`}>▾</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => stepTeam(1)}
            disabled={selIndex === last.order.length - 1}
            aria-label="Drużyna niżej w tabeli"
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-lg text-brand-cream/70 text-xl font-black hover:bg-brand-cream/8 active:scale-95 transition disabled:opacity-20 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
          >›</button>
        </div>

        {/* siatka wszystkich drużyn */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${pickerOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          aria-hidden={!pickerOpen}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 pt-2">
              {last.order.map((team, i) => {
                const on = team === selected;
                return (
                  <button
                    key={team}
                    type="button"
                    tabIndex={pickerOpen ? 0 : -1}
                    aria-pressed={on}
                    onClick={() => { pick(team); setPickerOpen(false); }}
                    className={`flex items-center gap-2 min-h-11 rounded-lg border px-2 py-1.5 text-left text-xs leading-tight transition-all duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 ${
                      on
                        ? 'border-brand-accent/60 bg-brand-accent/15 text-brand-accent font-black'
                        : 'border-brand-cream/8 bg-brand-cream/[0.03] text-brand-cream/65 font-semibold hover:border-brand-cream/20 hover:bg-brand-cream/[0.06] hover:text-brand-cream/90'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-6 h-6 flex-shrink-0 rounded-full text-[10px] font-black ${on ? 'bg-brand-accent text-brand-dark' : 'bg-brand-cream/8 text-brand-cream/45'}`}>{i + 1}</span>
                    <span className="min-w-0 line-clamp-2 break-words">{team}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* animacja sezonu */}
      <div className="px-3 sm:px-5 pt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Zatrzymaj animację' : 'Odtwórz sezon'}
          className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-full bg-brand-accent text-brand-dark shadow-[0_0_18px_rgba(34,197,94,0.3)] transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cream/60"
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="3.5" height="12" rx="1" /><rect x="8.5" y="1" width="3.5" height="12" rx="1" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.6v10.8a.8.8 0 0 0 1.2.7l9-5.4a.8.8 0 0 0 0-1.4l-9-5.4A.8.8 0 0 0 3 1.6z" /></svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-brand-cream/35 mb-1">
            <span>{isPlaying ? 'Odtwarzanie' : atEnd ? 'Odtwórz sezon' : 'Wstrzymano'}</span>
            <span className="text-brand-cream/70">Kolejka {current.round}</span>
          </div>
          <input
            type="range"
            min="0"
            max={maxI}
            step="1"
            value={ci}
            aria-label="Kolejka"
            onChange={e => { setPlaying(null); goTo(Number(e.target.value)); }}
            className="w-full h-1.5 accent-brand-accent cursor-pointer"
          />
        </div>
        <button
          type="button"
          onClick={() => setSpeed(s => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
          aria-label={`Prędkość animacji ${speed}×`}
          className="w-11 h-9 flex-shrink-0 rounded-lg border border-brand-cream/10 bg-brand-cream/[0.03] text-xs font-black text-brand-cream/60 hover:text-brand-cream/90 hover:border-brand-cream/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
        >
          {speed}×
        </button>
      </div>

      <div className="p-3 sm:p-5 flex">
        <div ref={plotRef} className="relative flex-1 min-w-0">
          {width > 0 && (
            <svg
              width={width}
              height={plotH + AXIS_H}
              className="block cursor-pointer touch-pan-y select-none"
              role="img"
              aria-label="Wykres miejsc drużyn w tabeli po każdej kolejce"
              onPointerMove={e => {
                const inPlot = e.clientY - e.currentTarget.getBoundingClientRect().top <= plotH;
                setHover(inPlot ? locate(e) : null);
              }}
              onPointerLeave={() => setHover(null)}
              onClick={e => pick(locate(e).team)}
            >
              <defs>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width={atEnd ? width : x(p)} height={plotH} />
                </clipPath>
              </defs>

              {/* numery miejsc i delikatna siatka */}
              {teams.map((_, i) => (
                <g key={i}>
                  <line x1={PAD_L} x2={width - PAD_R} y1={y(i + 1)} y2={y(i + 1)} stroke={CREAM} strokeOpacity="0.04" />
                  <text x={PAD_L - 10} y={y(i + 1)} textAnchor="end" dominantBaseline="central" fontSize="10" fill={CREAM} fillOpacity="0.3">{i + 1}</text>
                </g>
              ))}

              {/* oś kolejek */}
              {snapshots.map((s, i) => {
                const show = i === maxI || (i % tickStep === 0 && (maxI - i) * step >= 18);
                return show && (
                  <text key={s.round} x={x(i)} y={plotH + 14} textAnchor="middle" fontSize="10" fill={CREAM} fillOpacity={i === ci ? 0.8 : 0.35}>{s.round}</text>
                );
              })}
              <text x={(PAD_L + width - PAD_R) / 2} y={plotH + 30} textAnchor="middle" fontSize="9" fill={CREAM} fillOpacity="0.25" letterSpacing="1.5">KOLEJKA</text>

              {!atEnd && <line x1={x(p)} x2={x(p)} y1={0} y2={plotH} stroke={ACCENT} strokeOpacity="0.25" strokeDasharray="3 4" />}
              {active && <line x1={x(active.i)} x2={x(active.i)} y1={0} y2={plotH} stroke={CREAM} strokeOpacity="0.18" />}

              <g clipPath={`url(#${clipId})`}>
                {teams.filter(t => t !== selected && t !== hovered).map(t => (
                  <path key={t} d={paths[t]} fill="none" stroke={CREAM} strokeOpacity="0.13" strokeWidth="1.5" strokeLinecap="round" />
                ))}
                {hovered && <path d={paths[hovered]} fill="none" stroke={CREAM} strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />}
                <path d={paths[selected]} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
              </g>
              <circle cx={x(p)} cy={headY} r="4.5" fill={ACCENT} stroke={SURFACE} strokeWidth="2" />

              {active && (
                <circle cx={x(active.i)} cy={y(tip.pos)} r="5" fill={active.team === selected ? ACCENT : CREAM} stroke={SURFACE} strokeWidth="2" />
              )}
            </svg>
          )}

          {active && (
            <div
              className="absolute z-10 pointer-events-none w-40 rounded-xl border border-brand-cream/10 bg-brand-dark/95 px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.4)]"
              style={{
                left: tipLeft,
                top: tipBelow ? y(tip.pos) + 14 : y(tip.pos) - 14,
                transform: `translate(-50%, ${tipBelow ? '0' : '-100%'})`,
              }}
            >
              <div className="text-[11px] font-black text-brand-cream/90 truncate">{active.team}</div>
              <div className="text-[10px] text-brand-cream/45 mt-0.5">Kolejka {tip.round} · miejsce <span className="font-bold text-brand-cream/80">{tip.pos}</span></div>
              <div className="text-[10px] text-brand-cream/45">{tip.pkt} pkt · bramki {tip.gf}:{tip.ga}</div>
            </div>
          )}
        </div>

        {/* tabela po bieżącej kolejce — podpisy linii. Przeskakują na nowe miejsca od razu
            (bez przesuwania), żeby przyciski nigdy na siebie nie nachodziły; ruch pokazuje strzałka. */}
        <div className="relative w-[124px] sm:w-[200px] flex-shrink-0 ml-1" style={{ height: plotH }}>
          {teams.map(team => {
            const pos = current.byTeam[team].pos;
            const move = ci > 0 ? snapshots[ci - 1].byTeam[team].pos - pos : 0;
            return (
              <button
                key={team}
                type="button"
                title={team}
                onClick={() => pick(team)}
                onPointerEnter={() => setHover({ i: ci, team })}
                onPointerLeave={() => setHover(null)}
                aria-pressed={team === selected}
                style={{ height: ROW_H - 4, transform: `translateY(${(pos - 1) * ROW_H + 2}px)` }}
                className={`absolute left-0 top-0 w-full flex items-center gap-1.5 rounded-lg border pl-1 pr-2 text-left text-[11px] sm:text-xs leading-none overflow-hidden transition-[color,background-color,border-color] duration-200 active:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 ${
                  team === selected ? 'z-10 border-brand-accent/50 bg-brand-accent/15 text-brand-accent font-black'
                    : team === hovered ? 'border-brand-cream/20 bg-brand-cream/[0.07] text-brand-cream/90 font-semibold'
                    : 'border-transparent text-brand-cream/50 font-medium hover:border-brand-cream/15 hover:bg-brand-cream/[0.05] hover:text-brand-cream/85'
                }`}
              >
                <span className={`flex items-center justify-center w-5 h-5 flex-shrink-0 rounded-full text-[10px] font-black transition-colors duration-300 ${
                  team === selected ? 'bg-brand-accent text-brand-dark' : 'bg-brand-cream/8 text-brand-cream/45'
                }`}>{pos}</span>
                <span className="min-w-0 flex-1 truncate">{team}</span>
                {move !== 0 && (
                  <span
                    className={`flex-shrink-0 text-[9px] font-black ${move > 0 ? 'text-green-400/80' : 'text-red-400/80'}`}
                    aria-label={move > 0 ? `awans o ${move}` : `spadek o ${-move}`}
                  >
                    {move > 0 ? '▲' : '▼'}<span className="hidden sm:inline">{Math.abs(move)}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeasonProgress;
