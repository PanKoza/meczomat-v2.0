import React, { useState, useEffect } from 'react';
import API from './api';

const TABS = [
  { id: 'articles', label: 'Wiadomości',  icon: '📰' },
  { id: 'videos',   label: 'Skróty wideo', icon: '🎥' },
  { id: 'streams',  label: 'Transmisje',   icon: '🔴', live: true },
];

const Empty = ({ icon, text, sub }) => (
  <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '4rem 2rem', textAlign: 'center' }}>
    <div style={{ fontSize: '2.5rem', opacity: 0.2, marginBottom: 12 }}>{icon}</div>
    <p style={{ color: 'var(--c-text-2)', fontWeight: 600 }}>{text}</p>
    {sub && <p style={{ color: 'var(--c-text-3)', fontSize: '0.875rem', marginTop: 4 }}>{sub}</p>}
  </div>
);

const PublicNews = () => {
  const [articles, setArticles] = useState([]);
  const [videos,   setVideos]   = useState([]);
  const [streams,  setStreams]   = useState([]);
  const [activeTab, setActiveTab] = useState('articles');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artRes, vidRes, streamRes] = await Promise.all([
          fetch(`${API}/api/articles`),
          fetch(`${API}/api/videos`),
          fetch(`${API}/api/streams`),
        ]);
        setArticles(await artRes.json());
        setVideos(await vidRes.json());
        setStreams(await streamRes.json());
      } catch (err) {
        console.error('Błąd pobierania danych:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.25rem' }} className="animate-fade-in">

      <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: 'var(--c-text)', lineHeight: 1.2, marginBottom: 10 }}>
          Centrum Kibica
        </h1>
        <p style={{ color: 'var(--c-text-2)', fontSize: '1rem', maxWidth: 560, margin: '0 auto' }}>
          Wiadomości, skróty meczów i transmisje na żywo z IV&nbsp;ligi, V&nbsp;ligi, okręgówki i niższych klas rozgrywkowych.
        </p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: '2rem', flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '0.6rem 1.25rem', borderRadius: 10,
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                transition: 'all 0.2s',
                background: active ? (tab.live ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.1)') : 'var(--c-surface)',
                border: `1px solid ${active ? (tab.live ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.3)') : 'var(--c-border)'}`,
                color: active ? (tab.live ? '#f87171' : 'var(--c-accent)') : 'var(--c-text-2)',
              }}>
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'articles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720, margin: '0 auto', width: '100%' }}>
          {articles.length === 0
            ? <Empty icon="📰" text="Brak wiadomości. Zajrzyj tu później!" />
            : articles.map(a => (
              <article key={a.id} style={{
                background: 'var(--c-surface)', border: '1px solid var(--c-border)',
                borderRadius: 16, overflow: 'hidden',
              }}>
                {/* Header bar */}
                <div style={{ padding: '1.5rem 2rem 1.25rem', borderBottom: '1px solid var(--c-border)' }}>
                  <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--c-text)', lineHeight: 1.35, marginBottom: 12 }}>{a.title}</h2>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--c-accent)', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                      ✍️ {a.author}
                    </span>
                    <span style={{ color: 'var(--c-text-3)', fontSize: '0.8rem' }}>📅 {a.date}</span>
                  </div>
                </div>
                {/* Body */}
                <div style={{ padding: '1.5rem 2rem' }}>
                  {a.content.split('\n\n').filter(Boolean).map((para, i) => (
                    <p key={i} style={{
                      color: 'var(--c-text)', fontSize: '1rem', lineHeight: 1.8,
                      marginBottom: i < a.content.split('\n\n').length - 1 ? '1.1rem' : 0,
                    }}>{para.trim()}</p>
                  ))}
                </div>
              </article>
            ))
          }
        </div>
      )}

      {activeTab === 'videos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
          {videos.length === 0
            ? <div style={{ gridColumn: '1/-1' }}><Empty icon="🎥" text="Brak skrótów wideo." /></div>
            : videos.map(v => (
              <div key={v.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                  <iframe style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    src={v.embedUrl} title={v.title} frameBorder="0" allowFullScreen />
                </div>
                <div style={{ padding: '1rem 1.25rem' }}>
                  <h3 style={{ fontWeight: 700, color: 'var(--c-text)', marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{v.title}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--c-text-3)', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span>🎥 {v.author}</span>
                    <span>{v.date}</span>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {activeTab === 'streams' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
          {streams.length === 0
            ? <div style={{ gridColumn: '1/-1' }}><Empty icon="🏟️" text="Brak transmisji na żywo w tym momencie." sub="Zaglądaj tu w weekendy podczas trwania kolejek!" /></div>
            : streams.map(s => (
              <div key={s.id} style={{ background: 'var(--c-surface)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
                  <iframe style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    src={s.embedUrl} title={s.title} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen />
                  <div style={{ position: 'absolute', top: 10, left: 10, background: '#dc2626', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 6, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'pulse-dot 1.2s ease-in-out infinite' }} />
                    LIVE
                  </div>
                </div>
                <div style={{ padding: '1rem 1.25rem' }}>
                  <h3 style={{ fontWeight: 800, color: '#f87171', marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{s.title}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(248,113,113,0.5)', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span>🔴 Transmisja na żywo</span>
                    <span>{s.date}</span>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};

export default PublicNews;
