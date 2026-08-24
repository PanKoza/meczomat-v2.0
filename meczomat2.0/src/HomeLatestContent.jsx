import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './api';

function useInView(threshold = 0.1) {
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

function ArticleCard({ article, navigate }) {
  const [ref, inView] = useInView();
  return (
    <article
      ref={ref}
      className={`latest-card latest-card-article${inView ? ' latest-in-view' : ''}`}
      style={{ '--ldi': '0s' }}
      onClick={() => navigate('/centrum-kibica')}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate('/centrum-kibica')}
      aria-label={`Artykuł: ${article.title}`}>
      <div className="latest-card-side" style={{ background: '#60a5fa' }} />
      <div className="latest-card-inner">
        <div className="latest-type-badge latest-badge-blue">📰 Artykuł</div>
        <h3 className="latest-card-title">{article.title}</h3>
        <p className="latest-card-text">{article.content}</p>
        <div className="latest-card-footer">
          <span className="latest-meta">✍️ {article.author}</span>
          <span className="latest-meta">{article.date}</span>
          <span className="latest-cta-link">Czytaj artykuł →</span>
        </div>
      </div>
    </article>
  );
}

function VideoCard({ video }) {
  const [ref, inView] = useInView();
  return (
    <article
      ref={ref}
      className={`latest-card latest-card-video${inView ? ' latest-in-view' : ''}`}
      style={{ '--ldi': '0.08s' }}>
      <div className="latest-card-side" style={{ background: '#22c55e' }} />
      <div className="latest-card-inner">
        <div className="latest-type-badge latest-badge-green">🎥 Skrót wideo</div>
        <h3 className="latest-card-title">{video.title}</h3>
        <div className="latest-embed-wrap">
          <iframe
            src={video.embedUrl}
            title={video.title}
            frameBorder="0"
            allowFullScreen
            className="latest-embed"
            loading="lazy"
          />
        </div>
        <div className="latest-card-footer">
          <span className="latest-meta">{video.date}</span>
        </div>
      </div>
    </article>
  );
}

function StreamCard({ stream }) {
  const [ref, inView] = useInView();
  return (
    <article
      ref={ref}
      className={`latest-card latest-card-stream${inView ? ' latest-in-view' : ''}`}
      style={{ '--ldi': '0.16s' }}>
      <div className="latest-card-side" style={{ background: '#f87171' }} />
      <div className="latest-card-inner">
        <div className="latest-type-badge latest-badge-red">
          <span className="neon-dot" style={{ background: '#f87171', width: 8, height: 8, flexShrink: 0 }} />
          Transmisja na żywo
        </div>
        <h3 className="latest-card-title latest-title-live">{stream.title}</h3>
        <div className="latest-embed-wrap">
          <iframe
            src={stream.embedUrl}
            title={stream.title}
            frameBorder="0"
            allow="autoplay; fullscreen"
            className="latest-embed"
            loading="lazy"
          />
        </div>
        <div className="latest-card-footer">
          <span className="latest-meta" style={{ color: '#f87171' }}>{stream.date}</span>
        </div>
      </div>
    </article>
  );
}

export default function HomeLatestContent({ latestContent }) {
  const navigate = useNavigate();
  const [secRef, inView] = useInView();
  const hasAny = latestContent.article || latestContent.video || latestContent.stream;
  const [fbClubs, setFbClubs] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/club-facebook`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) return;
        // Pick 5 random clubs
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setFbClubs(shuffled.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  return (
    <section
      ref={secRef}
      className={`latest-section${inView ? ' latest-section-in-view' : ''}`}
      aria-label="Najnowsze treści – artykuły, wideo i transmisje">

      <div className="latest-inner">

        {/* Header */}
        <div className="leagues-header">
          <h2 className="leagues-h2">Najnowsze ze świata piłki</h2>
          <p className="leagues-sub">
            Artykuły redakcyjne, skróty wideo i <strong>transmisje na żywo</strong> z niższych lig polskiej piłki nożnej.
            Bądź na bieżąco z rozgrywkami w Twoim regionie.
          </p>
        </div>

        {hasAny ? (
          <div className="latest-list">
            {latestContent.article && (
              <ArticleCard article={latestContent.article} navigate={navigate} />
            )}
            {latestContent.video && (
              <VideoCard video={latestContent.video} />
            )}
            {latestContent.stream && (
              <StreamCard stream={latestContent.stream} />
            )}
          </div>
        ) : (
          <div className="latest-empty">
            <span style={{ fontSize: '3rem' }} aria-hidden="true">📡</span>
            <p className="latest-empty-text">Brak dostępnych treści. Sprawdź ponownie wkrótce.</p>
          </div>
        )}

        <div className="latest-bottom-cta">
          <button onClick={() => navigate('/centrum-kibica')} className="btn-primary latest-big-btn">
            Przejdź do Centrum Kibica — wszystkie artykuły i wideo →
          </button>
        </div>

        {fbClubs.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <div className="leagues-header" style={{ marginBottom: '1.5rem' }}>
              <h2 className="leagues-h2">Kluby na Facebooku</h2>
              <p className="leagues-sub">Tutaj znajdziesz wszystkie Fan Page swoich ulubionych drużyn.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: 20 }}>
              {fbClubs.map(club => {
                const embedUrl = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(club.facebookUrl)}&tabs=timeline&width=500&height=600&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&appId`;
                return (
                  <div key={club._id || club.id}
                    style={{ background: 'var(--c-surface)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.25)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(24,119,242,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)'; }}
                  >
                    <div style={{ padding: '0.9rem 1.2rem', background: 'linear-gradient(135deg,rgba(24,119,242,0.18),rgba(37,99,235,0.08))', borderBottom: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#1877f2,#0c52a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 12px rgba(24,119,242,0.45)', fontWeight: 900, fontSize: '1.1rem', color: '#fff', fontFamily: 'Georgia,serif' }}>f</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: 'var(--c-text)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{club.clubName}</div>
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
            <div className="latest-bottom-cta" style={{ marginTop: '1.5rem' }}>
              <button onClick={() => { navigate('/centrum-kibica'); }} className="btn-primary latest-big-btn">
                Zobacz wszystkie kluby na Facebooku →
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
