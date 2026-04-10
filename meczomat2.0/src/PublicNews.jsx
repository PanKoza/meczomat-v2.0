import React, { useState, useEffect } from 'react';

const PublicNews = () => {
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [streams, setStreams] = useState([]); // Transmisje na żywo
  const [activeTab, setActiveTab] = useState('articles'); // 'articles', 'videos', 'streams'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artRes, vidRes, streamRes] = await Promise.all([
          fetch('http://localhost:3001/api/articles'),
          fetch('http://localhost:3001/api/videos'),
          fetch('http://localhost:3001/api/streams')
        ]);
        setArticles(await artRes.json());
        setVideos(await vidRes.json());
        setStreams(await streamRes.json());
      } catch (error) {
        console.error("Błąd pobierania danych:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-black text-brand-cream mb-3">Centrum Kibica</h1>
        <p className="text-base text-brand-cream/30">Najnowsze informacje, skróty meczów i transmisje z lokalnych boisk.</p>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
        <button onClick={() => setActiveTab('articles')}
          className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-sm transition-all duration-300 border ${
            activeTab === 'articles'
              ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20 shadow-[0_0_16px_rgba(0,255,136,0.08)]'
              : 'text-brand-cream/35 border-brand-cream/8 hover:border-brand-cream/15 hover:text-brand-cream/60'
          }`}>
          📰 Wiadomości
        </button>
        <button onClick={() => setActiveTab('videos')}
          className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-sm transition-all duration-300 border ${
            activeTab === 'videos'
              ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20 shadow-[0_0_16px_rgba(0,255,136,0.08)]'
              : 'text-brand-cream/35 border-brand-cream/8 hover:border-brand-cream/15 hover:text-brand-cream/60'
          }`}>
          🎥 Skróty Wideo
        </button>
        <button onClick={() => setActiveTab('streams')}
          className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-sm transition-all duration-300 border flex items-center gap-2 ${
            activeTab === 'streams'
              ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_16px_rgba(239,68,68,0.08)]'
              : 'text-brand-cream/35 border-brand-cream/8 hover:border-red-500/20 hover:text-red-400/60'
          }`}>
          <span className={activeTab === 'streams' ? 'animate-pulse' : ''}>🔴</span> Transmisje
        </button>
      </div>

      {/* ARTICLES */}
      {activeTab === 'articles' && (
        <div className="space-y-5 max-w-4xl mx-auto">
          {articles.map(article => (
            <article key={article.id} className="glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-[2px] h-full bg-brand-accent/40"></div>
              <h2 className="text-2xl sm:text-3xl font-black text-brand-cream mb-3">{article.title}</h2>
              <div className="flex items-center gap-3 text-[10px] font-bold text-brand-cream/20 uppercase tracking-widest mb-5">
                <span className="bg-brand-accent/8 text-brand-accent/60 px-2.5 py-1 rounded">✍️ {article.author}</span>
                <span>·</span>
                <span>{article.date}</span>
              </div>
              <p className="text-brand-cream/45 leading-relaxed whitespace-pre-wrap">{article.content}</p>
            </article>
          ))}
          {articles.length === 0 && <div className="text-center text-brand-cream/20 py-10 font-medium">Brak wiadomości. Zajrzyj tu później!</div>}
        </div>
      )}

      {/* VIDEOS */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {videos.map(video => (
            <div key={video.id} className="glass-card rounded-2xl overflow-hidden group">
              <div className="relative pt-[56.25%] bg-black/30 overflow-hidden">
                <iframe className="absolute top-0 left-0 w-full h-full transform group-hover:scale-[1.02] transition-transform duration-500" src={video.embedUrl} title={video.title} frameBorder="0" allowFullScreen></iframe>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-brand-cream line-clamp-2 mb-2">{video.title}</h3>
                <div className="text-[10px] text-brand-cream/15 font-bold uppercase tracking-widest flex justify-between">
                  <span>🎥 {video.author}</span>
                  <span>{video.date}</span>
                </div>
              </div>
            </div>
          ))}
          {videos.length === 0 && <div className="col-span-2 text-center text-brand-cream/20 py-10 font-medium">Brak skrótów wideo.</div>}
        </div>
      )}

      {/* STREAMS */}
      {activeTab === 'streams' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {streams.map(stream => (
            <div key={stream.id} className="glass-card rounded-2xl overflow-hidden border-red-500/10 group">
              <div className="relative pt-[56.25%] bg-black/30 overflow-hidden border-b border-red-500/20">
                <iframe className="absolute top-0 left-0 w-full h-full" src={stream.embedUrl} title={stream.title} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen></iframe>
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg animate-pulse uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span> Live
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-black text-lg text-red-400 line-clamp-2 mb-2">{stream.title}</h3>
                <div className="text-[10px] text-red-400/30 font-bold uppercase tracking-widest flex justify-between">
                  <span>🔴 Transmisja</span>
                  <span>{stream.date}</span>
                </div>
              </div>
            </div>
          ))}
          {streams.length === 0 && (
            <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center glass-card rounded-2xl py-16 text-center">
              <span className="text-4xl mb-3 opacity-20">🏟️</span>
              <p className="text-brand-cream/25 font-medium">Brak transmisji na żywo w tym momencie.</p>
              <p className="text-brand-cream/12 mt-1 text-sm">Zaglądaj tu w weekendy podczas trwania kolejek!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicNews;