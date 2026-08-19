import React, { useRef, useEffect, useState } from 'react';

const NATIONAL = [
  {
    id: 'Ekstraklasa', leagueId: 'ekstraklasa',
    name: 'PKO BP Ekstraklasa', tier: 1, type: 'national',
    color: '#f59e0b', icon: '🏆',
    desc: 'Najwyższa klasa rozgrywkowa w Polsce',
    teams: 18,
  },
  {
    id: 'I Liga', leagueId: '1-liga',
    name: 'Betclic 1. Liga', tier: 2, type: 'national',
    color: '#60a5fa', icon: '⚽',
    desc: 'Bezpośrednie zaplecze Ekstraklasy',
    teams: 18,
  },
  {
    id: 'II Liga', leagueId: '2-liga',
    name: 'Betclic 2. Liga', tier: 3, type: 'national',
    color: '#c084fc', icon: '⚽',
    desc: 'Trzeci poziom ligowy w Polsce',
    teams: 16,
  },
  {
    id: 'III Liga', leagueId: '3-liga-gr1',
    name: '3. Liga', tier: 4, type: 'national',
    color: '#34d399', icon: '⚽',
    desc: 'Czwarty poziom — 4 grupy regionalne',
    teams: 64,
  },
];

const REGIONAL = [
  { id: 'IV Liga',        name: '4. Liga',   icon: '📍', color: '#22c55e', desc: 'Regionalny poziom rozgrywek' },
  { id: 'V Liga',         name: '5. Liga',   icon: '📍', color: '#16a34a', desc: 'Piąty szczebel ligowy' },
  { id: 'Klasa Okręgowa', name: 'Okręgówka', icon: '🎯', color: '#0891b2', desc: 'Prawdziwa polska piłka nożna' },
  { id: 'A-Klasa',        name: 'A-Klasa',   icon: '🟢', color: '#2563eb', desc: 'Amatorski futbol na poziomie' },
  { id: 'B-Klasa',        name: 'B-Klasa',   icon: '🍺', color: '#7c3aed', desc: 'Piłka dla każdego kibica' },
];

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

export default function HomeLeagues({ onLevelSelect }) {
  const [secRef, inView] = useInView();

  return (
    <section ref={secRef} className={`leagues-section${inView ? ' leagues-in-view' : ''}`}
      aria-label="Rozgrywki ligowe – wybierz ligę">

      <div className="leagues-inner">

        {/* Header */}
        <div className="leagues-header">
          <h2 className="leagues-h2">
            Znajdź swoją ligę
          </h2>
          <p className="leagues-sub">
            Od <strong>Ekstraklasy</strong> po <strong>B-klasę</strong> — przeglądaj tabele, terminarze i wyniki
            meczów ze wszystkich szczebli piłkarskich w Polsce. Ponad 100 rozgrywek, 16 województw.
          </p>
        </div>

        {/* National leagues */}
        <div className="leagues-group-title">
          <span>Ogólnopolskie</span>
          <div className="leagues-divider-line" />
        </div>

        <div className="national-grid">
          {NATIONAL.map((league, i) => (
            <button
              key={league.id}
              className="national-card"
              style={{ '--cc': league.color, '--di': `${i * 0.08}s` }}
              onClick={() => onLevelSelect({ id: league.id, type: league.type, name: league.name })}
              aria-label={`Przejdź do ${league.name}`}>
              <div className="national-card-bar" />
              <div className="national-card-body">
                <div className="national-card-top-row">
                  <span className="national-icon">{league.icon}</span>
                  <span className="national-tier-badge">Poziom {league.tier}</span>
                </div>
                <div className="national-name">{league.name}</div>
                <div className="national-desc">{league.desc}</div>
                <div className="national-teams">{league.teams} drużyn</div>
              </div>
              <div className="national-arrow">›</div>
            </button>
          ))}
        </div>

        {/* Regional leagues */}
        <div className="leagues-group-title" style={{ marginTop: '2.5rem' }}>
          <span>Regionalne i amatorskie</span>
          <div className="leagues-divider-line" />
        </div>

        <div className="regional-grid">
          {REGIONAL.map((level, i) => (
            <button
              key={level.id}
              className="regional-card"
              style={{ '--cc': level.color, '--di': `${i * 0.07}s` }}
              onClick={() => onLevelSelect({ id: level.id, type: 'regional', name: level.name })}
              aria-label={`Przeglądaj ${level.name}`}>
              <div className="regional-icon-wrap">
                <span className="regional-icon">{level.icon}</span>
              </div>
              <div className="regional-name">{level.name}</div>
              <div className="regional-desc">{level.desc}</div>
              <div className="regional-arrow">→</div>
            </button>
          ))}
        </div>

        {/* SEO text — crawlable, low visual prominence */}
        <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)', lineHeight: 1.6, marginTop: '2rem', textAlign: 'center', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          Meczomat.pl udostępnia <strong>wyniki meczów piłkarskich</strong> i <strong>tabele ligowe</strong> ze wszystkich
          szczebli rozgrywek w Polsce — <strong>IV liga</strong>, <strong>V liga</strong>,{' '}
          <strong>klasa okręgowa</strong>, <strong>A-klasa</strong> i <strong>B-klasa</strong> w województwach:
          dolnośląskim, małopolskim, mazowieckim, śląskim, wielkopolskim i pozostałych 11 województwach.
          Aktualne <strong>terminarze meczów</strong>, <strong>składy drużyn</strong> i statystyki sezonowe.
        </p>

      </div>
    </section>
  );
}
