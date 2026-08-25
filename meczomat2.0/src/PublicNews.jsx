import React, { useState, useEffect } from 'react';
import API from './api';

const REGIONS = [
  { id: '', name: 'Cała Polska', icon: '🇵🇱', subregions: [] },
  {
    id: 'Dolnośląskie', name: 'Dolnośląskie', icon: '⛰️',
    subregions: ['Wrocław', 'Legnica', 'Jelenia Góra', 'Wałbrzych'],
  },
];

const LEAGUE_LEVELS = [
  { id: '', name: 'Wszystkie poziomy' },
  { id: 'Ekstraklasa', name: 'Ekstraklasa' },
  { id: 'I Liga', name: '1. Liga' },
  { id: 'II Liga', name: '2. Liga' },
  { id: 'III Liga', name: '3. Liga' },
  { id: 'IV Liga', name: '4. Liga' },
  { id: 'V Liga', name: '5. Liga' },
  { id: 'Klasa Okręgowa', name: 'Okręgówka' },
  { id: 'A-Klasa', name: 'A-Klasa' },
  { id: 'B-Klasa', name: 'B-Klasa' },
];

const TYPE_FILTERS = [
  { id: 'all',      label: 'Wszystkie',    icon: '🏟️' },
  { id: 'articles', label: 'Wiadomości',   icon: '📰' },
  { id: 'videos',   label: 'Wideo',        icon: '🎥' },
  { id: 'streams',  label: 'Transmisje',   icon: '🔴', live: true },
  { id: 'facebook', label: 'Kluby na FB',  icon: '📘', fb: true },
];

const matchesRegion = (item, province, subregion) => {
  if (!province) return true;
  if (item.province && item.province !== province) return false;
  if (subregion && item.subregion && item.subregion !== subregion) return false;
  return true;
};

const Pill = ({ active, onClick, children, color = 'green', small = false }) => {
  const C = {
    green: { bg: 'rgba(34,197,94,0.12)', bdr: 'rgba(34,197,94,0.32)', txt: 'var(--c-accent)' },
    red:   { bg: 'rgba(239,68,68,0.12)', bdr: 'rgba(239,68,68,0.35)', txt: '#f87171' },
    blue:  { bg: 'rgba(59,130,246,0.13)', bdr: 'rgba(59,130,246,0.35)', txt: '#93c5fd' },
  }[color];
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: small ? '0.55rem 1.1rem' : '0.65rem 1.25rem',
      borderRadius: 20, fontWeight: 700,
      fontSize: small ? '0.9375rem' : '0.9375rem',
      cursor: 'pointer', transition: 'all 0.17s',
      background: active ? C.bg : 'var(--c-surface)',
      border: `1px solid ${active ? C.bdr : 'var(--c-border)'}`,
      color: active ? C.txt : 'var(--c-text)',
      boxShadow: active ? `0 0 10px ${C.bg}` : 'none',
    }}>{children}</button>
  );
};

const SectionHeader = ({ icon, title, count, color = '#22c55e' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2rem 0 1.1rem' }}>
    <span style={{ fontSize: '1.25rem' }}>{icon}</span>
    <h2 style={{ fontWeight: 900, fontSize: '1.125rem', color: 'var(--c-text)', margin: 0 }}>{title}</h2>
    {count != null && (
      <span style={{ background: `${color}1a`, color, fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20, border: `1px solid ${color}40` }}>{count}</span>
    )}
    <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
  </div>
);

const Empty = ({ icon, text, sub }) => (
  <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '3rem 2rem', textAlign: 'center' }}>
    <div style={{ fontSize: '2rem', opacity: 0.18, marginBottom: 10 }}>{icon}</div>
    <p style={{ color: 'var(--c-text-3)', fontWeight: 600, fontSize: '0.9375rem' }}>{text}</p>
    {sub && <p style={{ color: 'var(--c-text-3)', fontSize: '0.875rem', marginTop: 4, opacity: 0.8 }}>{sub}</p>}
  </div>
);

const RegionTag = ({ province, subregion }) => {
  if (!province) return null;
  return <span style={{ fontSize: '0.68rem', color: 'var(--c-text-3)' }}>📍 {province}{subregion ? ` / ${subregion}` : ''}</span>;
};

const ShowMore = ({ shown, total, onMore }) => {
  if (shown >= total) return null;
  return (
    <button onClick={onMore} style={{
      display: 'block', width: '100%', marginTop: 12,
      padding: '0.65rem', borderRadius: 10, cursor: 'pointer',
      background: 'var(--c-surface)', border: '1px solid var(--c-border)',
      color: 'var(--c-text-2)', fontWeight: 700, fontSize: '0.9rem',
      transition: 'all 0.18s',
    }}>
      Pokaż więcej ({Math.min(10, total - shown)} z {total - shown} pozostałych) ›
    </button>
  );
};

const PublicNews = () => {
  const [articles,     setArticles]     = useState([]);
  const [videos,       setVideos]       = useState([]);
  const [streams,      setStreams]       = useState([]);
  const [clubFacebook, setClubFacebook] = useState([]);

  const [activeType,      setActiveType]      = useState('all');
  const [activeProvince,  setActiveProvince]  = useState('');
  const [activeSubregion, setActiveSubregion] = useState('');
  const [fbLevel,         setFbLevel]         = useState('');
  const [fbProvince,      setFbProvince]      = useState('');
  const [fbSubregion,     setFbSubregion]     = useState('');

  const [showA, setShowA] = useState(5);
  const [showV, setShowV] = useState(5);
  const [showS, setShowS] = useState(5);
  const [showF, setShowF] = useState(4);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aR, vR, sR, fR] = await Promise.all([
          fetch(`${API}/api/articles`),
          fetch(`${API}/api/videos`),
          fetch(`${API}/api/streams`),
          fetch(`${API}/api/club-facebook`),
        ]);
        const [aD, vD, sD, fD] = await Promise.all([aR.json(), vR.json(), sR.json(), fR.json()]);
        setArticles(Array.isArray(aD)  ? aD : []);
        setVideos(Array.isArray(vD)    ? vD : []);
        setStreams(Array.isArray(sD)   ? sD : []);
        setClubFacebook(Array.isArray(fD) ? fD : []);
      } catch (err) { console.error('Blad:', err); }
    };
    fetchData();
  }, []);

  const selectedRegion   = REGIONS.find(r => r.id === activeProvince);
  const hasSubregions    = selectedRegion?.subregions?.length > 0;
  const fbSelectedRegion = REGIONS.find(r => r.id === fbProvince);
  const fbHasSubregions  = fbSelectedRegion?.subregions?.length > 0;

  const setProvince = (id) => { setActiveProvince(id); setActiveSubregion(''); setShowA(5); setShowV(5); setShowS(5); };
  const setFbProv   = (id) => { setFbProvince(id); setFbSubregion(''); setShowF(5); };

  const fA = articles.filter(i     => matchesRegion(i, activeProvince, activeSubregion));
  const fV = videos.filter(i       => matchesRegion(i, activeProvince, activeSubregion));
  const fS = streams.filter(i      => matchesRegion(i, activeProvince, activeSubregion));
  const fF = clubFacebook.filter(i =>
    matchesRegion(i, fbProvince, fbSubregion) && (!fbLevel || i.league === fbLevel)
  );

  const show = (t) => activeType === 'all' || activeType === t;

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '2rem 1.25rem' }} className="animate-fade-in">

      <header style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--c-text)', lineHeight: 1.2, marginBottom: 8 }}>
          Centrum Kibica
        </h1>
        <p style={{ color: 'var(--c-text-2)', fontSize: '0.95rem', maxWidth: 560, margin: '0 auto' }}>
          Wiadomosci, skroty meczow, transmisje i profile klubowe z calej Polski.
        </p>
      </header>

      {/* TYPE FILTER */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
        {TYPE_FILTERS.map(t => (
          <Pill key={t.id} active={activeType === t.id}
            onClick={() => setActiveType(t.id)}
            color={t.live ? 'red' : t.fb ? 'blue' : 'green'}>
            {t.icon} {t.label}
          </Pill>
        ))}
      </div>

      {/* REGION FILTER */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '0.85rem 1.2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 7 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Region</span>
          {REGIONS.map(r => (
            <Pill key={r.id} active={activeProvince === r.id} onClick={() => setProvince(r.id)} small color="green">
              {r.icon} {r.name}
            </Pill>
          ))}
        </div>
        {hasSubregions && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--c-border)' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Podregion</span>
            <Pill active={activeSubregion === ''} onClick={() => setActiveSubregion('')} small color="green">Wszystkie</Pill>
            {selectedRegion.subregions.map(s => (
              <Pill key={s} active={activeSubregion === s} onClick={() => setActiveSubregion(s)} small color="green">{s}</Pill>
            ))}
          </div>
        )}
      </div>

      {/* KLUBY NA FACEBOOKU */}
      {show('facebook') && (
        <section>
          <SectionHeader icon="�" title="Kluby na Facebooku" count={fF.length} color="#60a5fa" />

          <div style={{ background: 'var(--c-surface)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 14, padding: '0.85rem 1.2rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 7 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Region</span>
              {REGIONS.map(r => (
                <Pill key={r.id} active={fbProvince === r.id} onClick={() => setFbProv(r.id)} small color="blue">
                  {r.icon} {r.name}
                </Pill>
              ))}
            </div>
            {fbHasSubregions && (
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Podregion</span>
                <Pill active={fbSubregion === ''} onClick={() => setFbSubregion('')} small color="blue">Wszystkie</Pill>
                {fbSelectedRegion.subregions.map(s => (
                  <Pill key={s} active={fbSubregion === s} onClick={() => setFbSubregion(s)} small color="blue">{s}</Pill>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Poziom</span>
              {LEAGUE_LEVELS.map(l => (
                <Pill key={l.id} active={fbLevel === l.id} onClick={() => setFbLevel(l.id)} small color="blue">{l.name}</Pill>
              ))}
            </div>
          </div>

          {fF.length === 0
            ? <Empty icon="📘" text="Brak stron Facebook dla wybranego filtra." />
            : <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))', gap: 20 }}>
                  {fF.slice(0, showF).map(club => {
                    const embedUrl = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(club.facebookUrl)}&tabs=timeline&width=500&height=600&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&appId`;
                    return (
                      <div key={club.id}
                        style={{ background: 'var(--c-surface)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.25)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(24,119,242,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)'; }}
                      >
                        <div style={{ padding: '0.9rem 1.2rem', background: 'linear-gradient(135deg,rgba(24,119,242,0.18),rgba(37,99,235,0.08))', borderBottom: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#1877f2,#0c52a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 12px rgba(24,119,242,0.45)', fontWeight: 900, fontSize: '1.1rem', color: '#fff', fontFamily: 'Georgia,serif' }}>f</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, color: 'var(--c-text)', fontSize: '0.97rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{club.clubName}</div>
                            <div style={{ fontSize: '0.68rem', color: '#60a5fa', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.league}{club.province ? ` · ${club.province}` : ''}{club.subregion ? ` / ${club.subregion}` : ''}</span>
                            </div>
                          </div>
                          <a href={club.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', fontWeight: 700, background: 'linear-gradient(135deg,#1877f2,#0c52a3)', color: '#fff', padding: '6px 14px', borderRadius: 20, textDecoration: 'none', flexShrink: 0, boxShadow: '0 2px 10px rgba(24,119,242,0.4)', whiteSpace: 'nowrap' }}>Otwórz →</a>
                        </div>
                        <div style={{ position: 'relative', height: 480, overflow: 'hidden' }}>
                          <iframe src={embedUrl} width="100%" height="540" style={{ border: 'none', display: 'block' }} scrolling="no" frameBorder="0" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" title={`Facebook - ${club.clubName}`} loading="lazy" />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to top, var(--c-surface, #12201a) 10%, transparent)', pointerEvents: 'none' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <ShowMore shown={showF} total={fF.length} onMore={() => setShowF(n => n + 10)} />
              </>
          }
        </section>
      )}

      {/* WIADOMOSCI */}
      {show('articles') && (
        <section>
          <SectionHeader icon="📰" title="Wiadomosci" count={fA.length} />
          {fA.length === 0
            ? <Empty icon="📰" text="Brak wiadomosci dla wybranego filtra." />
            : <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {fA.slice(0, showA).map(a => (
                    <article key={a.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ padding: '1.2rem 1.5rem 0.9rem', borderBottom: '1px solid var(--c-border)' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--c-text)', lineHeight: 1.35, marginBottom: 10 }}>{a.title}</h2>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--c-accent)', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>✍️ {a.author}</span>
                          <span style={{ color: 'var(--c-text-3)', fontSize: '0.72rem' }}>📅 {a.date}</span>
                          <RegionTag province={a.province} subregion={a.subregion} />
                        </div>
                      </div>
                      <div style={{ padding: '1rem 1.5rem' }}>
                        {a.content.split('\n\n').filter(Boolean).map((para, i) => (
                          <p key={i} style={{ color: 'var(--c-text)', fontSize: '0.93rem', lineHeight: 1.75, marginBottom: '0.8rem' }}>{para.trim()}</p>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
                <ShowMore shown={showA} total={fA.length} onMore={() => setShowA(n => n + 10)} />
              </>
          }
        </section>
      )}

      {/* WIDEO */}
      {show('videos') && (
        <section>
          <SectionHeader icon="🎥" title="Skroty wideo" count={fV.length} />
          {fV.length === 0
            ? <Empty icon="🎥" text="Brak skrotow wideo dla wybranego filtra." />
            : <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                  {fV.slice(0, showV).map(v => (
                    <div key={v.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                        <iframe style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                          src={v.embedUrl} title={v.title} frameBorder="0" allowFullScreen />
                      </div>
                      <div style={{ padding: '0.85rem 1.1rem' }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--c-text)', fontSize: '0.88rem', marginBottom: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{v.title}</h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', color: 'var(--c-text-3)', fontSize: '0.7rem' }}>
                          <span>🎥 {v.author}</span><span>{v.date}</span>
                          <RegionTag province={v.province} subregion={v.subregion} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <ShowMore shown={showV} total={fV.length} onMore={() => setShowV(n => n + 10)} />
              </>
          }
        </section>
      )}

      {/* TRANSMISJE */}
      {show('streams') && (
        <section>
          <SectionHeader icon="🔴" title="Transmisje NA ZYWO" count={fS.length} color="#ef4444" />
          {fS.length === 0
            ? <Empty icon="🏟️" text="Brak transmisji na zywo." sub="Zagladaj tu w weekendy podczas kolejek!" />
            : <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
                  {fS.slice(0, showS).map(s => (
                    <div key={s.id} style={{ background: 'var(--c-surface)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                        <iframe style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                          src={s.embedUrl} title={s.title} frameBorder="0" allowFullScreen allow="autoplay; fullscreen" />
                        <div style={{ position: 'absolute', top: 10, left: 10, background: '#dc2626', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: 6, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'pulse-dot 1.2s ease-in-out infinite' }} />LIVE
                        </div>
                      </div>
                      <div style={{ padding: '0.85rem 1.1rem' }}>
                        <h3 style={{ fontWeight: 800, color: '#f87171', fontSize: '0.93rem', marginBottom: 4 }}>{s.title}</h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ color: 'rgba(248,113,113,0.5)', fontSize: '0.7rem' }}>{s.date}</span>
                          <RegionTag province={s.province} subregion={s.subregion} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <ShowMore shown={showS} total={fS.length} onMore={() => setShowS(n => n + 10)} />
              </>
          }
        </section>
      )}

    </div>
  );
};

export default PublicNews;
