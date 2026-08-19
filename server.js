require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { createClient } = require('redis');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('Brak JWT_SECRET w pliku .env');

// Middleware weryfikujący token JWT
function requireAuth(req, res, next) {
  const auth = req.headers['authorization'];
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Brak tokenu sesji.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token nieważny lub wygasł.' });
  }
}

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://meczomat.pl',
    'https://www.meczomat.pl',
    /\.onrender\.com$/
  ]
}));
app.use(express.json());

// --- REDIS z fallbackiem na in-memory ---
let redisReady = false;
const memCache = {}; // fallback gdy Redis niedostępny
const redis = createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
redis.on('error', () => { redisReady = false; });
redis.connect()
  .then(() => { redisReady = true; console.log('🟥 Połączono z Redis'); })
  .catch(() => console.warn('⚠️ Redis niedostępny — używam in-memory cache'));

async function cacheGet(key) {
  if (redisReady) return redis.get(key);
  const entry = memCache[key];
  return entry && Date.now() < entry.exp ? entry.val : null;
}
async function cacheSet(key, ttlSec, value) {
  if (redisReady) return redis.setEx(key, ttlSec, value);
  memCache[key] = { val: value, exp: Date.now() + ttlSec * 1000 };
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('Brak MONGO_URI w pliku .env');

mongoose.connect(MONGO_URI)
  .then(() => console.log('📦 Sukces! Połączono z chmurową bazą MongoDB!'))
  .catch(err => console.error('❌ Błąd połączenia z MongoDB:', err));

// --- MODELE BAZY DANYCH ---
const ArticleSchema = new mongoose.Schema({ title: String, content: String, author: String, date: String, province: String, subregion: String }, { timestamps: true });
const Article = mongoose.model('Article', ArticleSchema);

const VideoSchema = new mongoose.Schema({ title: String, embedUrl: String, author: String, date: String, province: String, subregion: String }, { timestamps: true });
const Video = mongoose.model('Video', VideoSchema);

const StreamSchema = new mongoose.Schema({ title: String, embedUrl: String, author: String, date: String, province: String, subregion: String }, { timestamps: true });
const Stream = mongoose.model('Stream', StreamSchema);

const ClubFacebookSchema = new mongoose.Schema({ clubName: String, facebookUrl: String, league: String, province: String, subregion: String }, { timestamps: true });
const ClubFacebook = mongoose.model('ClubFacebook', ClubFacebookSchema);

// --- 1. SŁOWNIK LIG (Linki do 90minut.pl) ---
const LEAGUES = {
  // Szczeble Centralne (Sezon 26/27)
  'ekstraklasa': 'http://www.90minut.pl/liga/1/liga14675.html',
  '1-liga': 'http://www.90minut.pl/liga/1/liga14676.html',
  '2-liga': 'http://www.90minut.pl/liga/1/liga14677.html',
  '3-liga-gr1': 'http://www.90minut.pl/liga/1/liga14742.html',
  '3-liga-gr2': 'http://www.90minut.pl/liga/1/liga14743.html',
  '3-liga-gr3': 'http://www.90minut.pl/liga/1/liga14744.html',
  '3-liga-gr4': 'http://www.90minut.pl/liga/1/liga14745.html',
  
  // Ligi Wojewódzkie
  // Dolnośląski ZPN (Sezon 26/27)
  'iv-liga': 'http://www.90minut.pl/liga/1/liga14768.html',
  'okregowka-Jelenia-Gora': 'http://www.90minut.pl/liga/1/liga14800.html',
  'okregowka-Legnica': 'http://www.90minut.pl/liga/1/liga14781.html',
  'okregowka-Walbrzych': 'http://www.90minut.pl/liga/1/liga14801.html',
  'okregowka-Wroclaw': 'http://www.90minut.pl/liga/1/liga15096.html',
  'Decathlon-Klasa-A-Jelenia-Gora-I': 'http://www.90minut.pl/liga/1/liga14879.html',
  'Decathlon-Klasa-A-Jelenia-Gora-II': 'http://www.90minut.pl/liga/1/liga14880.html',
  'Decathlon-Klasa-A-Jelenia-Gora-III': 'http://www.90minut.pl/liga/1/liga14881.html',
  'Decathlon-Klasa-A-Legnica-I': 'http://www.90minut.pl/liga/1/liga14811.html',
  'Decathlon-Klasa-A-Legnica-II': 'http://www.90minut.pl/liga/1/liga14812.html',
  'Decathlon-Klasa-A-Legnica-III': 'http://www.90minut.pl/liga/1/liga14813.html',
  'Decathlon-Klasa-A-Walbrzych-I': 'http://www.90minut.pl/liga/1/liga14814.html',
  'Decathlon-Klasa-A-Walbrzych-II': 'http://www.90minut.pl/liga/1/liga14815.html',
  'Decathlon-Klasa-A-Walbrzych-III': 'http://www.90minut.pl/liga/1/liga14816.html',
  'Decathlon-Klasa-A-Wroclaw-I': 'http://www.90minut.pl/liga/1/liga14784.html',
  'Decathlon-Klasa-A-Wroclaw-II': 'http://www.90minut.pl/liga/1/liga14785.html',
  'Decathlon-Klasa-A-Wroclaw-III': 'http://www.90minut.pl/liga/1/liga14786.html',
  'Decathlon-Klasa-A-Wroclaw-IV': 'http://www.90minut.pl/liga/1/liga14787.html',
  'Klasa-B-Jelenia-Gora-I': 'http://www.90minut.pl/liga/1/liga14976.html',
  'Klasa-B-Jelenia-Gora-II': 'http://www.90minut.pl/liga/1/liga14977.html',
  'Klasa-B-Jelenia-Gora-III': 'http://www.90minut.pl/liga/1/liga14978.html',
  'Klasa-B-Jelenia-Gora-IV': 'http://www.90minut.pl/liga/1/liga14979.html',
  'Klasa-B-Jelenia-Gora-V': 'http://www.90minut.pl/liga/1/liga14980.html',
  'Klasa-B-Legnica-I': 'http://www.90minut.pl/liga/1/liga14842.html',
  'Klasa-B-Legnica-II': 'http://www.90minut.pl/liga/1/liga14843.html',
  'Klasa-B-Legnica-III': 'http://www.90minut.pl/liga/1/liga14844.html',
  'Klasa-B-Legnica-IV': 'http://www.90minut.pl/liga/1/liga14845.html',
  'Klasa-B-Legnica-V': 'http://www.90minut.pl/liga/1/liga14846.html',
  'Klasa-B-Walbrzych-I': 'http://www.90minut.pl/liga/1/liga14882.html',
  'Klasa-B-Walbrzych-II': 'http://www.90minut.pl/liga/1/liga14883.html',
  'Klasa-B-Walbrzych-III': 'http://www.90minut.pl/liga/1/liga14884.html',
  'Klasa-B-Walbrzych-IV': 'http://www.90minut.pl/liga/1/liga14885.html',
  'Klasa-B-Walbrzych-V': 'http://www.90minut.pl/liga/1/liga14886.html',
  'Klasa-B-Wroclaw-I': 'http://www.90minut.pl/liga/1/liga14788.html',
  'Klasa-B-Wroclaw-II': 'http://www.90minut.pl/liga/1/liga14789.html',
  'Klasa-B-Wroclaw-III': 'http://www.90minut.pl/liga/1/liga14790.html',
  'Klasa-B-Wroclaw-IV': 'http://www.90minut.pl/liga/1/liga14791.html',
  'Klasa-B-Wroclaw-V': 'http://www.90minut.pl/liga/1/liga14792.html',
  'Klasa-B-Wroclaw-VI': 'http://www.90minut.pl/liga/1/liga14793.html',
  'Klasa-B-Wroclaw-VII': 'http://www.90minut.pl/liga/1/liga14794.html',
  'Klasa-B-Wroclaw-VIII': 'http://www.90minut.pl/liga/1/liga14795.html',
  'iv-liga-opolska': 'TUTAJ_WKLEJ_LINK_Z_90MINUT'
};

// --- 2. MULTI-CACHE ---
let fetchPromises = {};
const CACHE_TTL_SEC = 15 * 60; // 15 minut — TTL ustawiany w Redis

// Hashe haseł redaktorów ładowane z .env (JOURNALIST_<LOGIN> = hash bcrypt)
const JOURNALISTS = {
  'admin':    process.env.JOURNALIST_ADMIN,
  'redaktor': process.env.JOURNALIST_REDAKTOR,
  'kamera':   process.env.JOURNALIST_KAMERA,
};

// --- GŁÓWNY SKRYPT SCRAPUJĄCY ---
async function fetchFrom90Minut(targetUrl) {
  try {
    const response = await axios.get(targetUrl, { responseType: 'arraybuffer' });
    const html = iconv.decode(response.data, 'iso-8859-2');
    const $ = cheerio.load(html);
    
    const tabela = [];
    const mecze = [];

    // --- WYCIĄGAMY TABELĘ ---
    $('table.main2').first().find('tr').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 8 && $(cols[1]).find('a').length > 0) {
        const bramki = $(cols[7]).text().trim();
        const [bramkiStrzelone, bramkiStracone] = bramki.split('-');

        tabela.push({
          pozycja: $(cols[0]).text().replace('.', '').trim(),
          nazwa: $(cols[1]).text().trim(),
          mecze: $(cols[2]).text().trim(),
          punkty: $(cols[3]).text().trim(),
          zwyciestwa: $(cols[4]).text().trim(),
          remisy: $(cols[5]).text().trim(),
          porazki: $(cols[6]).text().trim(),
          bramkiStrzelone: bramkiStrzelone || '0',
          bramkiStracone: bramkiStracone || '0',
          herb: null, 
          status: null 
        });
      }
    });

    // --- WYCIĄGAMY MECZE I TERMINARZ ---
    let aktualnaKolejka = '-';
    
    $('table.main').each((i, table) => {
      const tekstTabeli = $(table).text();
      
      if (tekstTabeli.includes('Kolejka')) {
        const match = tekstTabeli.match(/Kolejka\s+(\d+)/);
        if (match) aktualnaKolejka = match[1];
      }

      $(table).find('tr').each((j, row) => {
        const cols = $(row).find('td');
        
        if (cols.length === 4) {
          const gospodarz = $(cols[0]).text().trim();
          const wynikText = $(cols[1]).text().trim();
          const gosc = $(cols[2]).text().trim();
          const dataText = $(cols[3]).text().trim();

          if (gospodarz && gosc && !gospodarz.includes('Kolejka')) {
            let wynikGospodarz = null;
            let wynikGosc = null;
            let status = (wynikText === '-') ? 'Nierozegrany' : 'Zakończony';

            const czystyWynik = wynikText.replace('*', '').trim();
            if (czystyWynik.includes('-') && czystyWynik !== '-') {
              const gole = czystyWynik.split('-');
              if (gole.length === 2) {
                wynikGospodarz = gole[0].trim();
                wynikGosc = gole[1].trim();
              }
            }

            let dataWizualna = dataText;
            let godzina = '--:--';
            if (dataText.includes(',')) {
              const czesci = dataText.split(',');
              dataWizualna = czesci[0].trim();
              godzina = czesci[1].trim();
            }

            mecze.push({
              id: Math.random().toString(36).substring(7), 
              dataWizualna: dataWizualna,
              godzina: godzina,
              kolejka: aktualnaKolejka,
              status: status, 
              gospodarz: { nazwa: gospodarz, herb: null },
              gosc: { nazwa: gosc, herb: null },
              wynikGospodarz: wynikGospodarz,
              wynikGosc: wynikGosc
            });
          }
        }
      });
    });

    return { tabela, mecze };

  } catch (error) {
    console.error('Błąd pobierania z 90minut:', error.message);
    return null;
  }
}

// --- ZARZĄDCA DANYCH ---
async function ensureDataIsFresh(ligaId) {
  const targetUrl = LEAGUES[ligaId];
  if (!targetUrl || targetUrl.includes('TUTAJ_WKLEJ')) {
    throw new Error("Brak prawidłowego linku dla tej ligi");
  }

  const cached = await cacheGet(`liga:${ligaId}`);
  if (cached) return true;

  if (fetchPromises[ligaId]) {
    await fetchPromises[ligaId];
    return true;
  }

  console.log(`🐌 Pobieram dane w locie dla [${ligaId}] z 90minut.pl...`);

  const currentTask = (async () => {
    const newData = await fetchFrom90Minut(targetUrl);
    if (newData && newData.tabela.length > 0) {
      await cacheSet(`liga:${ligaId}`, CACHE_TTL_SEC, JSON.stringify(newData));
    }
  })();

  fetchPromises[ligaId] = currentTask;
  await currentTask;
  fetchPromises[ligaId] = null;
  return true;
}

// --- ENDPOINTY ZAWODÓW ---
app.get('/api/tabela', async (req, res) => {
  const ligaId = req.query.liga || 'iv-liga';
  try {
    await ensureDataIsFresh(ligaId);
    console.log(`⚡ Oddaję TABELE dla [${ligaId}]`);
    const raw = await cacheGet(`liga:${ligaId}`);
    res.json(raw ? JSON.parse(raw).tabela : []);
  } catch(e) {
    res.status(400).json({error: "Błąd ligi lub brak linku"});
  }
});

app.get('/api/mecze', async (req, res) => {
  const ligaId = req.query.liga || 'iv-liga';
  try {
    await ensureDataIsFresh(ligaId);
    console.log(`⚡ Oddaję MECZE dla [${ligaId}]`);
    const raw = await cacheGet(`liga:${ligaId}`);
    res.json(raw ? JSON.parse(raw).mecze : []);
  } catch(e) {
    res.status(400).json({error: "Błąd ligi lub brak linku"});
  }
});

// Inwalidacja cache ligi po zmianie linku — tylko lokalnie/dev
app.delete('/api/cache/:ligaId', requireAuth, async (req, res) => {
  const { ligaId } = req.params;
  if (redisReady) await redis.del(`liga:${ligaId}`);
  else delete memCache[`liga:${ligaId}`];
  res.json({ success: true, cleared: `liga:${ligaId}` });
});

// --- ENDPOINTY LOGOWANIA ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const hash = JOURNALISTS[username];
  if (hash && await bcrypt.compare(password, hash)) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, username, token });
  } else {
    res.status(401).json({ success: false, error: 'Błędny login lub hasło!' });
  }
});

// ==========================================================
// --- ENDPOINTY ARTYKUŁÓW I WIDEO (TERAZ Z MONGODB) ---
// ==========================================================

// --- ARTYKUŁY ---
app.get('/api/articles', async (req, res) => {
  try {
    // Pobieramy wszystkie artykuły z bazy i sortujemy od najnowszego
    const docs = await Article.find().sort({ createdAt: -1 });
    res.json(docs.map(d => ({ id: d._id, title: d.title, content: d.content, author: d.author, date: d.date, province: d.province || '', subregion: d.subregion || '' })));
  } catch (err) {
    res.status(500).json({ error: 'Błąd bazy danych' });
  }
});

app.post('/api/articles', requireAuth, async (req, res) => {
  const { title, content, province, subregion } = req.body;
  const author = req.user.username;
  try {
    const newArticle = await Article.create({
      title, content, author, province: province || '', subregion: subregion || '',
      date: new Date().toLocaleDateString('pl-PL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    });
    res.json({ success: true, article: { id: newArticle._id, title, content, author, province, subregion, date: newArticle.date } });
  } catch (err) {
    res.status(500).json({ error: 'Błąd podczas zapisu w bazie' });
  }
});

app.post('/api/articles/delete', requireAuth, async (req, res) => {
  const { id } = req.body;
  try {
    await Article.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania' });
  }
});

// --- SKRÓTY WIDEO ---
app.get('/api/videos', async (req, res) => {
  try {
    const docs = await Video.find().sort({ createdAt: -1 });
    res.json(docs.map(d => ({ id: d._id, title: d.title, embedUrl: d.embedUrl, author: d.author, date: d.date, province: d.province || '', subregion: d.subregion || '' })));
  } catch (err) {
    res.status(500).json({ error: 'Błąd bazy danych' });
  }
});

app.post('/api/videos', requireAuth, async (req, res) => {
  const { title, embedUrl, province, subregion } = req.body;
  const author = req.user.username;
  try {
    const newVideo = await Video.create({
      title, embedUrl, author, province: province || '', subregion: subregion || '',
      date: new Date().toLocaleDateString('pl-PL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    });
    res.json({ success: true, video: { id: newVideo._id, title, embedUrl, author, province, subregion, date: newVideo.date } });
  } catch (err) {
    res.status(500).json({ error: 'Błąd zapisu' });
  }
});

app.post('/api/videos/delete', requireAuth, async (req, res) => {
  const { id } = req.body;
  try {
    await Video.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania' });
  }
});

// --- TRANSMISJE NA ŻYWO (STREAMS) ---
app.get('/api/streams', async (req, res) => {
  try {
    const docs = await Stream.find().sort({ createdAt: -1 });
    res.json(docs.map(d => ({ id: d._id, title: d.title, embedUrl: d.embedUrl, author: d.author, date: d.date, province: d.province || '', subregion: d.subregion || '' })));
  } catch (err) {
    res.status(500).json({ error: 'Błąd bazy danych' });
  }
});

app.post('/api/streams', requireAuth, async (req, res) => {
  const { title, embedUrl, province, subregion } = req.body;
  const author = req.user.username;
  try {
    const newStream = await Stream.create({
      title, embedUrl, author, province: province || '', subregion: subregion || '',
      date: new Date().toLocaleDateString('pl-PL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    });
    res.json({ success: true, stream: { id: newStream._id, title, embedUrl, author, province, subregion, date: newStream.date } });
  } catch (err) {
    res.status(500).json({ error: 'Błąd zapisu' });
  }
});

app.post('/api/streams/delete', requireAuth, async (req, res) => {
  const { id } = req.body;
  try {
    await Stream.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania' });
  }
});

// --- STRONY FACEBOOK KLUBÓW ---
app.get('/api/club-facebook', async (req, res) => {
  try {
    const docs = await ClubFacebook.find().sort({ clubName: 1 });
    res.json(docs.map(d => ({ id: d._id, clubName: d.clubName, facebookUrl: d.facebookUrl, league: d.league, province: d.province || '', subregion: d.subregion || '' })));
  } catch (err) {
    res.status(500).json({ error: 'Błąd bazy danych' });
  }
});

app.post('/api/club-facebook', requireAuth, async (req, res) => {
  const { clubName, facebookUrl, league, province, subregion } = req.body;
  if (!clubName || !facebookUrl || !league) return res.status(400).json({ error: 'Brakujące pola' });
  try {
    const doc = await ClubFacebook.create({ clubName, facebookUrl, league, province: province || '', subregion: subregion || '' });
    res.json({ success: true, club: { id: doc._id, clubName, facebookUrl, league, province, subregion } });
  } catch (err) {
    res.status(500).json({ error: 'Błąd zapisu' });
  }
});

app.post('/api/club-facebook/delete', requireAuth, async (req, res) => {
  const { id } = req.body;
  try {
    await ClubFacebook.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania' });
  }
});

// SPA fallback — serwuje index.html dla nieznanych ścieżek (React Router history mode)
const path = require('path');
const DIST = path.join(__dirname, 'meczomat2.0', 'dist');
app.use(express.static(DIST));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Serwer działa na http://localhost:${PORT}`);
});