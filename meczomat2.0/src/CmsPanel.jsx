import React, { useState, useEffect } from 'react';

const CmsPanel = () => {
  const [activeSubTab, setActiveSubTab] = useState('articles'); // 'articles', 'videos', 'streams'
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [streams, setStreams] = useState([]); 
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); 
  const [videoUrl, setVideoUrl] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    const savedUser = localStorage.getItem('meczomat_user');
    const savedPass = localStorage.getItem('meczomat_pass');
    if (savedUser && savedPass) {
      setIsLoggedIn(true); setUsername(savedUser); setPassword(savedPass);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [artRes, vidRes, streamRes] = await Promise.all([
        fetch('http://localhost:3001/api/articles'),
        fetch('http://localhost:3001/api/videos'),
        fetch('http://localhost:3001/api/streams') 
      ]);
      
      const articlesData = await artRes.json();
      const videosData = await vidRes.json();
      const streamsData = await streamRes.json();

      // ZABEZPIECZENIE: Zapisujemy dane TYLKO, jeśli są prawidłowymi tablicami
      setArticles(Array.isArray(articlesData) ? articlesData : []);
      setVideos(Array.isArray(videosData) ? videosData : []);
      setStreams(Array.isArray(streamsData) ? streamsData : []);
      
    } catch (error) { 
      console.error("Błąd pobierania:", error); 
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError('');
    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true); localStorage.setItem('meczomat_user', username); localStorage.setItem('meczomat_pass', password);
      } else setLoginError(data.error);
    } catch (error) { setLoginError("Błąd połączenia."); }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setUsername(''); setPassword('');
    localStorage.removeItem('meczomat_user'); localStorage.removeItem('meczomat_pass');
  };

  const getYoutubeEmbedUrl = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return alert("Podaj tytuł!");

    let payload = { title, author: username, password };
    let endpoint = '';

    if (activeSubTab === 'articles') {
      if (!content) return alert("Napisz treść artykułu!");
      payload.content = content; endpoint = 'http://localhost:3001/api/articles';
    } else if (activeSubTab === 'videos') {
      const embedUrl = getYoutubeEmbedUrl(videoUrl);
      if (!embedUrl) return alert("Błędny link YouTube!");
      payload.embedUrl = embedUrl; endpoint = 'http://localhost:3001/api/videos';
    } else if (activeSubTab === 'streams') {
      const embedUrl = getYoutubeEmbedUrl(videoUrl);
      if (!embedUrl) return alert("Błędny link YouTube!");
      payload.embedUrl = embedUrl; endpoint = 'http://localhost:3001/api/streams';
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (res.ok) { setTitle(''); setContent(''); setVideoUrl(''); fetchData(); } 
      else alert("Brak uprawnień lub błąd bazy!");
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id, type) => {
    if(!window.confirm("Na pewno usunąć?")) return;
    let endpoint = '';
    if (type === 'article') endpoint = 'http://localhost:3001/api/articles/delete';
    if (type === 'video') endpoint = 'http://localhost:3001/api/videos/delete';
    if (type === 'stream') endpoint = 'http://localhost:3001/api/streams/delete';
    
    try {
      await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, author: username, password }) });
      fetchData();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-5xl mx-auto mt-4 animate-fade-in">
      
      {/* TABS */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-brand-accent/6 pb-4">
        <button onClick={() => setActiveSubTab('articles')}
          className={`px-5 py-2 rounded-lg font-bold text-sm transition-all border ${
            activeSubTab === 'articles'
              ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
              : 'text-brand-cream/30 border-brand-cream/6 hover:border-brand-cream/15'
          }`}>
          📝 Wiadomości
        </button>
        <button onClick={() => setActiveSubTab('videos')}
          className={`px-5 py-2 rounded-lg font-bold text-sm transition-all border ${
            activeSubTab === 'videos'
              ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
              : 'text-brand-cream/30 border-brand-cream/6 hover:border-brand-cream/15'
          }`}>
          🎥 Wideo
        </button>
        <button onClick={() => setActiveSubTab('streams')}
          className={`px-5 py-2 rounded-lg font-bold text-sm transition-all border ${
            activeSubTab === 'streams'
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : 'text-brand-cream/30 border-brand-cream/6 hover:border-red-500/15'
          }`}>
          🔴 Transmisje
        </button>
      </div>

      {isLoggedIn ? (
        <div className="glass-card p-6 sm:p-8 rounded-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent"></div>
          <div className="flex justify-between items-center mb-5 border-b border-brand-accent/6 pb-4">
            <h2 className="text-lg font-black text-brand-cream flex items-center gap-2">🛠️ Panel Admina <span className="text-brand-cream/20 font-medium text-sm">({username})</span></h2>
            <button onClick={handleLogout} className="text-xs bg-brand-cream/5 hover:bg-red-500/10 hover:text-red-400 text-brand-cream/30 px-4 py-2 rounded-lg font-bold transition-colors border border-brand-cream/6 hover:border-red-500/15">Wyloguj</button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Tytuł..." value={title} onChange={(e) => setTitle(e.target.value)}
              className="input-futuristic w-full text-lg font-bold" />
            
            {activeSubTab === 'articles' ? (
              <textarea placeholder="Treść wpisu..." value={content} onChange={(e) => setContent(e.target.value)} rows="5"
                className="input-futuristic w-full resize-none" />
            ) : (
              <input type="text" placeholder="Link do YouTube (np. https://youtu.be/...)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                className={`input-futuristic w-full ${activeSubTab === 'streams' ? 'focus:border-red-500 text-red-400' : ''}`} />
            )}

            <button type="submit" disabled={isSubmitting}
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
                isSubmitting ? 'bg-brand-cream/5 text-brand-cream/20 cursor-not-allowed' : 
                activeSubTab === 'streams' 
                  ? 'bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                  : 'btn-neon'
              }`}>
              {isSubmitting ? 'Przetwarzanie...' : (activeSubTab === 'articles' ? 'Opublikuj Artykuł 🚀' : activeSubTab === 'videos' ? 'Dodaj Skrót Wideo 📺' : 'Dodaj Transmisję NA ŻYWO 🔴')}
            </button>
          </form>
        </div>
      ) : (
        <div className="glass-card p-6 sm:p-8 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="text-brand-cream/30 font-medium text-sm">Jesteś redaktorem? Zaloguj się, aby zarządzać treścią.</div>
          <form onSubmit={handleLogin} className="flex gap-2">
            <input type="text" placeholder="Login" value={username} onChange={(e) => setUsername(e.target.value)}
              className="input-futuristic w-full sm:w-32 text-sm" />
            <input type="password" placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-futuristic w-full sm:w-32 text-sm" />
            <button type="submit" className="btn-neon px-5 py-2 rounded-lg text-sm whitespace-nowrap">Wejdź</button>
          </form>
          {loginError && <span className="text-red-400 text-xs font-bold">{loginError}</span>}
        </div>
      )}

      {/* CONTENT LISTS */}
      {activeSubTab === 'articles' && (
        <div className="space-y-4">
          {articles.map(article => (
            <article key={article.id} className="glass-card p-5 rounded-xl relative group">
              {isLoggedIn && <button onClick={() => handleDelete(article.id, 'article')} className="absolute top-3 right-3 bg-red-500/8 text-red-400/60 px-3 py-1 rounded-md text-[10px] font-bold hover:bg-red-500/20 hover:text-red-400 transition-colors border border-red-500/10">Usuń</button>}
              <h4 className="text-base font-bold text-brand-cream mb-1 pr-16">{article.title}</h4>
              <p className="text-brand-cream/25 text-sm line-clamp-2">{article.content}</p>
            </article>
          ))}
          {articles.length === 0 && <p className="text-center text-brand-cream/20 py-10">Brak wiadomości w bazie.</p>}
        </div>
      )}

      {activeSubTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map(video => (
            <div key={video.id} className="glass-card p-4 rounded-xl relative">
              {isLoggedIn && <button onClick={() => handleDelete(video.id, 'video')} className="absolute top-2 right-2 z-10 bg-red-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-lg hover:bg-red-700 transition-colors">Usuń</button>}
              <iframe className="w-full aspect-video rounded-lg mb-3" src={video.embedUrl} title={video.title} frameBorder="0" allowFullScreen></iframe>
              <h4 className="font-bold text-brand-cream text-sm">{video.title}</h4>
            </div>
          ))}
          {videos.length === 0 && <p className="col-span-2 text-center text-brand-cream/20 py-10">Brak wideo w bazie.</p>}
        </div>
      )}

      {activeSubTab === 'streams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {streams.map(stream => (
            <div key={stream.id} className="glass-card p-4 rounded-xl border-red-500/10 relative">
              {isLoggedIn && <button onClick={() => handleDelete(stream.id, 'stream')} className="absolute top-2 right-2 z-10 bg-red-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-lg hover:bg-red-700 transition-colors">Usuń</button>}
              <iframe className="w-full aspect-video rounded-lg mb-3 ring-1 ring-red-500/20" src={stream.embedUrl} title={stream.title} frameBorder="0" allowFullScreen></iframe>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                <h4 className="font-bold text-red-400 text-sm">{stream.title}</h4>
              </div>
            </div>
          ))}
          {streams.length === 0 && <p className="col-span-2 text-center text-brand-cream/20 py-10">Brak transmisji w bazie.</p>}
        </div>
      )}
    </div>
  );
};

export default CmsPanel;