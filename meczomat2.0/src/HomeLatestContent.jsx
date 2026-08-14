import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  return (
    <section
      ref={secRef}
      className={`latest-section${inView ? ' latest-section-in-view' : ''}`}
      aria-label="Najnowsze treści – artykuły, wideo i transmisje">

      <div className="latest-inner">

        {/* Header */}
        <div className="leagues-header">
          <div className="leagues-tag">📰 Aktualności</div>
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

      </div>
    </section>
  );
}
