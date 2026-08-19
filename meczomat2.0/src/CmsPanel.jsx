import React, { useState, useEffect } from 'react';
import API from './api';

const REGIONS = [
  { id: '', name: 'Cała Polska (bez regionu)' },
  { id: 'Dolnośląskie', name: 'Dolnośląskie', subregions: ['Wrocław', 'Legnica', 'Jelenia Góra', 'Wałbrzych'] },
];

const LEAGUE_LEVELS = [
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

const CmsPanel = () => {
  const [activeSubTab, setActiveSubTab] = useState('articles'); // 'articles', 'videos', 'streams', 'facebook'
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [streams, setStreams] = useState([]); 
  const [clubFacebook, setClubFacebook] = useState([]);
  const [fbSearch, setFbSearch] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [token, setToken] = useState(null);

  // rejestracja
  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMsg, setRegMsg] = useState('');

  // profil
  const [showProfile, setShowProfile] = useState(false);
  const [profUsername, setProfUsername] = useState('');
  const [profCurrent, setProfCurrent] = useState('');
  const [profNew, setProfNew] = useState('');
  const [profMsg, setProfMsg] = useState('');

  // zarządzanie użytkownikami (admin)
  const [showUsers, setShowUsers] = useState(false);
  const [cmsUsers, setCmsUsers] = useState([]);
  const [editUser, setEditUser] = useState(null); // { id, username, newUsername, newPassword }
  const [usersMsg, setUsersMsg] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); 
  const [videoUrl, setVideoUrl] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fbClubName, setFbClubName] = useState('');
  const [fbUrl, setFbUrl] = useState('');
  const [fbLeague, setFbLeague] = useState('IV Liga');

  const [province, setProvince] = useState('');
  const [subregion, setSubregion] = useState('');
  const [fbProvince, setFbProvince] = useState('');
  const [fbSubregion, setFbSubregion] = useState('');

  const selectedRegion    = REGIONS.find(r => r.id === province);
  const fbSelectedRegion  = REGIONS.find(r => r.id === fbProvince);

  useEffect(() => {
    fetchData();
    const savedUser = localStorage.getItem('meczomat_user');
    const savedRole = localStorage.getItem('meczomat_role');
    const savedToken = localStorage.getItem('meczomat_token');
    if (savedUser && savedToken) {
      setIsLoggedIn(true); setUsername(savedUser); setUserRole(savedRole || 'editor'); setToken(savedToken);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [artRes, vidRes, streamRes, fbRes] = await Promise.all([
        fetch(`${API}/api/articles`),
        fetch(`${API}/api/videos`),
        fetch(`${API}/api/streams`),
        fetch(`${API}/api/club-facebook`),
      ]);
      
      const articlesData = await artRes.json();
      const videosData = await vidRes.json();
      const streamsData = await streamRes.json();
      const fbData = await fbRes.json();

      setArticles(Array.isArray(articlesData) ? articlesData : []);
      setVideos(Array.isArray(videosData) ? videosData : []);
      setStreams(Array.isArray(streamsData) ? streamsData : []);
      setClubFacebook(Array.isArray(fbData) ? fbData : []);
      
    } catch (error) { 
      console.error("Błąd pobierania:", error); 
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError('');
    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true); setToken(data.token); setUserRole(data.role);
        localStorage.setItem('meczomat_user', data.username);
        localStorage.setItem('meczomat_role', data.role);
        localStorage.setItem('meczomat_token', data.token);
        setUsername(data.username);
      } else setLoginError(data.error);
    } catch { setLoginError("Błąd połączenia."); }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setUsername(''); setPassword(''); setToken(null); setUserRole('');
    localStorage.removeItem('meczomat_user'); localStorage.removeItem('meczomat_token'); localStorage.removeItem('meczomat_role');
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setRegMsg('');
    try {
      const res = await fetch(`${API}/api/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, password: regPassword }),
      });
      const data = await res.json();
      setRegMsg(data.error || data.message || 'Gotowe!');
      if (!data.error) { setRegUsername(''); setRegPassword(''); }
    } catch { setRegMsg('Błąd połączenia.'); }
  };

  const fetchCmsUsers = async () => {
    const res = await fetch(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setCmsUsers(Array.isArray(data) ? data : []);
  };

  const approveUser = async (id) => {
    await fetch(`${API}/api/admin/users/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    fetchCmsUsers();
  };
  const rejectUser = async (id) => {
    await fetch(`${API}/api/admin/users/${id}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    fetchCmsUsers();
  };
  const deleteUser = async (id) => {
    if (!confirm('Usunąć konto?')) return;
    await fetch(`${API}/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchCmsUsers();
  };
  const changeRole = async (id, role) => {
    await fetch(`${API}/api/admin/users/${id}/role`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    });
    fetchCmsUsers();
  };
  const saveEditUser = async () => {
    if (!editUser) return; setUsersMsg('');
    const res = await fetch(`${API}/api/admin/users/${editUser.id}/update`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username: editUser.newUsername || undefined, password: editUser.newPassword || undefined }),
    });
    const data = await res.json();
    setUsersMsg(data.error || 'Zapisano.');
    if (!data.error) { setEditUser(null); fetchCmsUsers(); }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault(); setProfMsg('');
    try {
      const res = await fetch(`${API}/api/profile/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: profUsername || undefined, currentPassword: profCurrent, newPassword: profNew || undefined }),
      });
      const data = await res.json();
      setProfMsg(data.error || 'Zapisano zmiany.');
      if (!data.error) {
        setProfCurrent(''); setProfNew('');
        if (profUsername) { setUsername(profUsername); localStorage.setItem('meczomat_user', profUsername); setProfUsername(''); }
      }
    } catch { setProfMsg('Błąd połączenia.'); }
  };

  const getYoutubeEmbedUrl = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const handleSubmitFacebook = async (e) => {
    e.preventDefault();
    if (!fbClubName || !fbUrl) return alert("Podaj nazwę klubu i link do Facebooka!");
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/club-facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ clubName: fbClubName, facebookUrl: fbUrl, league: fbLeague, province: fbProvince, subregion: fbSubregion }),
      });
      if (res.ok) { setFbClubName(''); setFbUrl(''); setFbProvince(''); setFbSubregion(''); fetchData(); }
      else alert("Brak uprawnień lub błąd bazy!");
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  const handleSubmit = async (e) => {    e.preventDefault();
    if (!title) return alert("Podaj tytuł!");

    let payload = { title, province, subregion };
    let endpoint = '';

    if (activeSubTab === 'articles') {
      if (!content) return alert("Napisz treść artykułu!");
      payload.content = content; endpoint = `${API}/api/articles`;
    } else if (activeSubTab === 'videos') {
      const embedUrl = getYoutubeEmbedUrl(videoUrl);
      if (!embedUrl) return alert("Błędny link YouTube!");
      payload.embedUrl = embedUrl; endpoint = `${API}/api/videos`;
    } else if (activeSubTab === 'streams') {
      const embedUrl = getYoutubeEmbedUrl(videoUrl);
      if (!embedUrl) return alert("Błędny link YouTube!");
      payload.embedUrl = embedUrl; endpoint = `${API}/api/streams`;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) { setTitle(''); setContent(''); setVideoUrl(''); setProvince(''); setSubregion(''); fetchData(); } 
      else alert("Brak uprawnień lub błąd bazy!");
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id, type) => {
    if(!window.confirm("Na pewno usunąć?")) return;
    let endpoint = '';
    if (type === 'article') endpoint = `${API}/api/articles/delete`;
    if (type === 'video') endpoint = `${API}/api/videos/delete`;
    if (type === 'stream') endpoint = `${API}/api/streams/delete`;
    if (type === 'facebook') endpoint = `${API}/api/club-facebook/delete`;
    
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
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
        <button onClick={() => setActiveSubTab('facebook')}
          className={`px-5 py-2 rounded-lg font-bold text-sm transition-all border ${
            activeSubTab === 'facebook'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'text-brand-cream/30 border-brand-cream/6 hover:border-blue-500/15'
          }`}>
          📘 Facebook Klubów
        </button>
      </div>

      {isLoggedIn ? (
        <div className="glass-card p-6 sm:p-8 rounded-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent"></div>
          <div className="flex justify-between items-center mb-5 border-b border-brand-accent/6 pb-4 flex-wrap gap-3">
            <h2 className="text-lg font-black text-brand-cream flex items-center gap-2">
              🛠️ Panel CMS
              <span className="text-brand-cream/20 font-medium text-sm">({username})</span>
              {userRole === 'admin' && <span className="text-[10px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
            </h2>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => { setShowProfile(!showProfile); setShowUsers(false); }} className="text-xs bg-brand-cream/5 hover:bg-brand-accent/10 hover:text-brand-accent text-brand-cream/30 px-3 py-2 rounded-lg font-bold transition-colors border border-brand-cream/6">
                👤 Profil
              </button>
              {userRole === 'admin' && (
                <button onClick={() => { setShowUsers(!showUsers); if (!showUsers) fetchCmsUsers(); setShowProfile(false); }} className="text-xs bg-brand-cream/5 hover:bg-yellow-500/10 hover:text-yellow-400 text-brand-cream/30 px-3 py-2 rounded-lg font-bold transition-colors border border-brand-cream/6">
                  👥 Użytkownicy
                </button>
              )}
              <button onClick={handleLogout} className="text-xs bg-brand-cream/5 hover:bg-red-500/10 hover:text-red-400 text-brand-cream/30 px-3 py-2 rounded-lg font-bold transition-colors border border-brand-cream/6 hover:border-red-500/15">Wyloguj</button>
            </div>
          </div>

          {/* PROFIL */}
          {showProfile && (
            <div className="mb-6 p-5 bg-brand-cream/3 border border-brand-cream/8 rounded-xl">
              <h3 className="font-bold text-brand-cream/60 text-sm mb-4">Zmień dane logowania</h3>
              <form onSubmit={handleProfileUpdate} className="space-y-3">
                <input type="text" placeholder={`Nowa nazwa użytkownika (obecna: ${username})`} value={profUsername} onChange={e => setProfUsername(e.target.value)} className="input-futuristic w-full text-sm" />
                <input type="password" placeholder="Aktualne hasło *" value={profCurrent} onChange={e => setProfCurrent(e.target.value)} className="input-futuristic w-full text-sm" required />
                <input type="password" placeholder="Nowe hasło (zostaw puste, aby nie zmieniać)" value={profNew} onChange={e => setProfNew(e.target.value)} className="input-futuristic w-full text-sm" />
                <button type="submit" className="btn-neon px-5 py-2 rounded-lg text-sm">Zapisz zmiany</button>
                {profMsg && <p className={`text-xs font-bold ${profMsg.includes('Błąd') || profMsg.includes('nieprawidłowe') || profMsg.includes('już') ? 'text-red-400' : 'text-brand-accent'}`}>{profMsg}</p>}
              </form>
            </div>
          )}

          {/* ZARZĄDZANIE UŻYTKOWNIKAMI (ADMIN) */}
          {showUsers && userRole === 'admin' && (
            <div className="mb-6 p-5 bg-yellow-500/3 border border-yellow-500/10 rounded-xl space-y-3">
              <h3 className="font-bold text-yellow-400/70 text-sm mb-1">Zarządzanie kontami</h3>
              {usersMsg && <p className="text-xs font-bold text-brand-accent">{usersMsg}</p>}
              {cmsUsers.map(u => (
                <div key={u._id} className="flex flex-wrap items-center gap-2 p-3 bg-brand-cream/3 rounded-lg border border-brand-cream/6">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-brand-cream text-sm">{u.username}</span>
                    <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${u.status === 'approved' ? 'bg-brand-accent/10 text-brand-accent' : u.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{u.status}</span>
                    <span className="ml-1 text-[10px] text-brand-cream/20">{u.role}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {u.status === 'pending' && <button onClick={() => approveUser(u._id)} className="text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-1 rounded font-bold hover:bg-brand-accent/20">Zatwierdź</button>}
                    {u.status === 'pending' && <button onClick={() => rejectUser(u._id)} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded font-bold hover:bg-red-500/20">Odrzuć</button>}
                    {u.status === 'approved' && u.role !== 'admin' && <button onClick={() => changeRole(u._id, 'admin')} className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded font-bold">→ Admin</button>}
                    {u.status === 'approved' && u.role === 'admin' && u.username !== username && <button onClick={() => changeRole(u._id, 'editor')} className="text-[10px] bg-brand-cream/5 text-brand-cream/30 px-2 py-1 rounded font-bold">→ Editor</button>}
                    <button onClick={() => setEditUser(editUser?.id === u._id ? null : { id: u._id, newUsername: '', newPassword: '' })} className="text-[10px] bg-brand-cream/5 text-brand-cream/40 px-2 py-1 rounded font-bold hover:bg-brand-cream/10">✏️</button>
                    {u.username !== username && <button onClick={() => deleteUser(u._id)} className="text-[10px] bg-red-500/8 text-red-400/60 px-2 py-1 rounded font-bold hover:bg-red-500/20 hover:text-red-400">🗑️</button>}
                  </div>
                  {editUser?.id === u._id && (
                    <div className="w-full flex gap-2 mt-1 flex-wrap">
                      <input type="text" placeholder="Nowa nazwa" value={editUser.newUsername} onChange={e => setEditUser({ ...editUser, newUsername: e.target.value })} className="input-futuristic text-xs flex-1 min-w-0" />
                      <input type="password" placeholder="Nowe hasło" value={editUser.newPassword} onChange={e => setEditUser({ ...editUser, newPassword: e.target.value })} className="input-futuristic text-xs flex-1 min-w-0" />
                      <button onClick={saveEditUser} className="text-xs btn-neon px-3 py-1 rounded">Zapisz</button>
                    </div>
                  )}
                </div>
              ))}
              {cmsUsers.length === 0 && <p className="text-brand-cream/20 text-sm text-center py-4">Brak użytkowników.</p>}
            </div>
          )}

          {activeSubTab === 'facebook' ? (
            <form onSubmit={handleSubmitFacebook} className="space-y-4">
              <input type="text" placeholder="Nazwa klubu..." value={fbClubName} onChange={(e) => setFbClubName(e.target.value)}
                className="input-futuristic w-full text-lg font-bold" />
              <input type="url" placeholder="Link do strony Facebook (https://www.facebook.com/...)" value={fbUrl} onChange={(e) => setFbUrl(e.target.value)}
                className="input-futuristic w-full" />
              <select value={fbLeague} onChange={(e) => setFbLeague(e.target.value)}
                className="input-futuristic w-full">
                {LEAGUE_LEVELS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select value={fbProvince} onChange={e => { setFbProvince(e.target.value); setFbSubregion(''); }} className="input-futuristic w-full text-sm">
                {REGIONS.map(r => <option key={r.id} value={r.id}>{r.id ? r.name : '🌍 Cała Polska (bez regionu)'}</option>)}
              </select>
              {fbSelectedRegion?.subregions?.length > 0 && (
                <select value={fbSubregion} onChange={e => setFbSubregion(e.target.value)} className="input-futuristic w-full text-sm">
                  <option value="">📍 Wszystkie podregiony</option>
                  {fbSelectedRegion.subregions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <button type="submit" disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25">
                {isSubmitting ? 'Przetwarzanie...' : 'Dodaj stronę Facebook 📘'}
              </button>
            </form>
          ) : (
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

              <select value={province} onChange={e => { setProvince(e.target.value); setSubregion(''); }} className="input-futuristic w-full text-sm">
                {REGIONS.map(r => <option key={r.id} value={r.id}>{r.id ? r.name : '🌍 Cała Polska (bez regionu)'}</option>)}
              </select>
              {selectedRegion?.subregions?.length > 0 && (
                <select value={subregion} onChange={e => setSubregion(e.target.value)} className="input-futuristic w-full text-sm">
                  <option value="">📍 Wszystkie podregiony</option>
                  {selectedRegion.subregions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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
          )}
        </div>
      ) : (
        <div className="glass-card p-6 sm:p-8 rounded-2xl mb-8">
          <div className="flex gap-4 mb-5 border-b border-brand-cream/6 pb-4">
            <button onClick={() => setShowRegister(false)} className={`text-sm font-bold pb-1 transition-colors ${!showRegister ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-cream/30 hover:text-brand-cream/60'}`}>Logowanie</button>
            <button onClick={() => setShowRegister(true)} className={`text-sm font-bold pb-1 transition-colors ${showRegister ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-cream/30 hover:text-brand-cream/60'}`}>Rejestracja</button>
          </div>

          {!showRegister ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="text" placeholder="Login" value={username} onChange={e => setUsername(e.target.value)} className="input-futuristic w-full text-sm" />
              <input type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} className="input-futuristic w-full text-sm" />
              <button type="submit" className="btn-neon w-full py-2.5 rounded-xl text-sm">Zaloguj się</button>
              {loginError && <p className="text-red-400 text-xs font-bold">{loginError}</p>}
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <p className="text-brand-cream/30 text-xs">Nowe konto musi zostać zatwierdzone przez admina przed pierwszym logowaniem.</p>
              <input type="text" placeholder="Nazwa użytkownika (min. 3 znaki)" value={regUsername} onChange={e => setRegUsername(e.target.value)} className="input-futuristic w-full text-sm" />
              <input type="password" placeholder="Hasło (min. 6 znaków)" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="input-futuristic w-full text-sm" />
              <button type="submit" className="btn-neon w-full py-2.5 rounded-xl text-sm">Zarejestruj się</button>
              {regMsg && <p className={`text-xs font-bold ${regMsg.includes('Błąd') || regMsg.includes('już') || regMsg.includes('musi') ? 'text-red-400' : 'text-brand-accent'}`}>{regMsg}</p>}
            </form>
          )}
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
              {(article.province || article.subregion) && <p className="text-brand-accent/40 text-xs mt-1">📍 {article.province}{article.subregion ? ` / ${article.subregion}` : ''}</p>}
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

      {activeSubTab === 'facebook' && (
        <div className="space-y-3">
          <input
            type="text"
            value={fbSearch}
            onChange={e => setFbSearch(e.target.value)}
            placeholder="🔍 Szukaj klubu..."
            className="w-full bg-brand-surface border border-brand-accent/10 rounded-xl px-4 py-2.5 text-sm text-brand-cream placeholder:text-brand-cream/25 focus:outline-none focus:border-brand-accent/30"
          />
          {clubFacebook.filter(c =>
            !fbSearch.trim() ||
            c.clubName.toLowerCase().includes(fbSearch.toLowerCase()) ||
            c.league.toLowerCase().includes(fbSearch.toLowerCase()) ||
            (c.province || '').toLowerCase().includes(fbSearch.toLowerCase())
          ).map(club => (
            <div key={club.id} className="glass-card p-4 rounded-xl flex items-center justify-between gap-4 relative">
              {isLoggedIn && <button onClick={() => handleDelete(club.id, 'facebook')} className="absolute top-2 right-2 bg-red-500/8 text-red-400/60 px-3 py-1 rounded-md text-[10px] font-bold hover:bg-red-500/20 hover:text-red-400 transition-colors border border-red-500/10">Usuń</button>}
              <div className="pr-14">
                <p className="font-bold text-brand-cream text-sm">{club.clubName}</p>
                <p className="text-brand-cream/30 text-xs mt-0.5">{club.league}</p>
                <a href={club.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400/70 text-xs hover:text-blue-400 break-all">{club.facebookUrl}</a>
              </div>
            </div>
          ))}
          {clubFacebook.length === 0 && <p className="text-center text-brand-cream/20 py-10">Brak stron Facebook w bazie.</p>}
          {clubFacebook.length > 0 && fbSearch.trim() && !clubFacebook.some(c => c.clubName.toLowerCase().includes(fbSearch.toLowerCase()) || c.league.toLowerCase().includes(fbSearch.toLowerCase()) || (c.province||'').toLowerCase().includes(fbSearch.toLowerCase())) && (
            <p className="text-center text-brand-cream/20 py-6">Brak wyników dla „{fbSearch}".</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CmsPanel;