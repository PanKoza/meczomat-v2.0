import React, { useState, useEffect, useRef } from 'react';

const TYPEWRITER_PHRASES = [
  'polskiej piłki nożnej',
  'IV ligi i V ligi',
  'klasy okręgowej',
  'A-klasy i B-klasy',
  'Twojego klubu',
];

const STATS = [
  { value: 16,   suffix: '',  label: 'Województw',  icon: '🗺️' },
  { value: 100,  suffix: '+', label: 'Lig',          icon: '⚽' },
  { value: 1000, suffix: '+', label: 'Drużyn',       icon: '👥' },
  { value: 24,   suffix: '/7',label: 'Na żywo',      icon: '🔴' },
];

function AnimatedCounter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1400;
        const steps = 60;
        const step = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          setCount(Math.round(current));
          if (current >= target) clearInterval(timer);
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (nodeRef.current) obs.observe(nodeRef.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={nodeRef}>{count}{suffix}</span>;
}

export default function HomeHero({ searchInput, setSearchInput, filteredGlobalTeams, changeLeagueAndTeam }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);

  // Typewriter loop
  useEffect(() => {
    const phrase = TYPEWRITER_PHRASES[phraseIdx];
    let timeout;
    if (!isDeleting) {
      if (typed.length < phrase.length) {
        timeout = setTimeout(() => setTyped(phrase.slice(0, typed.length + 1)), 65);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2200);
      }
    } else {
      if (typed.length > 0) {
        timeout = setTimeout(() => setTyped(phrase.slice(0, typed.length - 1)), 35);
      } else {
        setIsDeleting(false);
        setPhraseIdx(i => (i + 1) % TYPEWRITER_PHRASES.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [typed, isDeleting, phraseIdx]);

  // Blinking cursor
  useEffect(() => {
    const t = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="hero-section" aria-label="Strona główna – wyszukiwarka meczów piłkarskich">

      {/* ── Animated background ─────────────────────────────── */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="hero-grid" />
        {[...Array(10)].map((_, i) => (
          <div key={i} className="hero-particle" style={{ '--i': i }} />
        ))}
      </div>

      <div className="hero-content">

        {/* Main headline – SEO H1 */}
        <h1 className="hero-h1 animate-hero-title">
          Wyniki niższych lig
          <br />
          <span className="hero-highlight">
            {typed}
            <span className="hero-cursor" aria-hidden="true" style={{ opacity: cursorOn ? 1 : 0 }}>|</span>
          </span>
        </h1>

        {/* SEO paragraph */}
        <p className="hero-sub animate-hero-sub">
          Sprawdź <strong>tabele ligowe</strong>, <strong>terminarze meczów</strong> i <strong>wyniki na żywo</strong> —
          {' '}<strong>IV liga</strong>, <strong>V liga</strong>, <strong>klasa okręgowa</strong>,{' '}
          <strong>A-klasa</strong>, <strong>B-klasa</strong>, Ekstraklasa, I&nbsp;Liga, II&nbsp;Liga, III&nbsp;Liga.
          Dane z <strong>16 województw</strong> w całej Polsce.
        </p>

        {/* ── Search bar ──────────────────────────────────── */}
        <div className="hero-search-outer animate-hero-search">
          <div className="hero-search-box">
            <span className="hero-search-icon" aria-hidden="true">⚽</span>
            <input
              type="search"
              placeholder='Wpisz nazwę klubu, np. "Zagłębie Lubin", "Warta Poznań"...'
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              aria-label="Wyszukaj klub piłkarski w Polsce"
              className="hero-search-input"
              autoComplete="off"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="hero-search-clear"
                aria-label="Wyczyść wyszukiwanie">
                ✕
              </button>
            )}
          </div>

          {/* Dropdown */}
          {searchInput.trim() && (
            <div className="hero-dropdown" role="listbox" aria-label="Wyniki wyszukiwania">
              {filteredGlobalTeams.length > 0 ? (
                filteredGlobalTeams.slice(0, 8).map((team, idx) => (
                  <button
                    key={idx}
                    role="option"
                    className="hero-dropdown-item"
                    onClick={() => { setSearchInput(''); changeLeagueAndTeam(team.province, team.level, team.leagueId, team.name); }}>
                    <div className="hero-dropdown-left">
                      <span className="hero-dropdown-name">{team.name}</span>
                      <span className="hero-dropdown-meta">{team.province} · {team.level}</span>
                    </div>
                    <span className="hero-dropdown-arrow">→</span>
                  </button>
                ))
              ) : (
                <div className="hero-dropdown-empty">
                  Nie znaleziono klubu „{searchInput}" — sprawdź pisownię
                </div>
              )}
            </div>
          )}

          <p className="hero-search-hint">
            Ponad <strong>1&nbsp;000 drużyn</strong> z całej Polski w naszej bazie danych
          </p>
        </div>


      </div>
    </section>
  );
}
