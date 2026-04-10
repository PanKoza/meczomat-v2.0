const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const mongoose = require('mongoose'); // <-- NOWOŚĆ: Połączenie z bazą danych

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// ==========================================================
// --- 0. POŁĄCZENIE Z BAZĄ DANYCH MONGODB ---
// UWAGA: WKLEJ TUTAJ SWÓJ LINK SKOPIOWANY Z MONGODB ATLAS
// (Pamiętaj o podmianie <password> na swoje hasło do bazy)
const MONGO_URI = 'mongodb+srv://PanKoza:Meczomat2005@cluster0.ijaep7g.mongodb.net/?appName=Cluster0';
// ==========================================================

mongoose.connect(MONGO_URI)
  .then(() => console.log('📦 Sukces! Połączono z chmurową bazą MongoDB!'))
  .catch(err => console.error('❌ Błąd połączenia z MongoDB:', err));

// --- MODELE BAZY DANYCH ---
const ArticleSchema = new mongoose.Schema({ title: String, content: String, author: String, date: String }, { timestamps: true });
const Article = mongoose.model('Article', ArticleSchema);

const VideoSchema = new mongoose.Schema({ title: String, embedUrl: String, author: String, date: String }, { timestamps: true });
const Video = mongoose.model('Video', VideoSchema);

const StreamSchema = new mongoose.Schema({ title: String, embedUrl: String, author: String, date: String }, { timestamps: true });
const Stream = mongoose.model('Stream', StreamSchema);

// --- 1. SŁOWNIK LIG (Linki do 90minut.pl) ---
const LEAGUES = {
  // Szczeble Centralne (Sezon 2025/2026)
  'ekstraklasa': 'http://www.90minut.pl/liga/1/liga14072.html',
  '1-liga': 'http://www.90minut.pl/liga/1/liga14073.html',
  '2-liga': 'http://www.90minut.pl/liga/1/liga14074.html',
  '3-liga-gr1': 'http://www.90minut.pl/liga/1/liga14154.html',
  '3-liga-gr2': 'http://www.90minut.pl/liga/1/liga14155.html',
  '3-liga-gr3': 'http://www.90minut.pl/liga/1/liga14156.html',
  '3-liga-gr4': 'http://www.90minut.pl/liga/1/liga14157.html',
  
  // Ligi Wojewódzkie
  'iv-liga': 'http://www.90minut.pl/liga/1/liga14169.html',
  'okregowka-Jelenia-Gora': 'http://www.90minut.pl/liga/1/liga14204.html',
  'okregowka-Legnica': 'http://www.90minut.pl/liga/1/liga14205.html',
  'okregowka-Walbrzych': 'http://www.90minut.pl/liga/1/liga14175.html',
  'okregowka-Wroclaw': 'http://www.90minut.pl/liga/1/liga14275.html',
  'a-klasa': 'TUTAJ_WKLEJ_LINK_Z_90MINUT',
  'iv-liga-opolska': 'TUTAJ_WKLEJ_LINK_Z_90MINUT'
};

// --- 2. MULTI-CACHE ---
let cache = {};      
let fetchPromises = {}; 
const CACHE_TIME = 15 * 60 * 1000; // 15 minut

// Lista uprawnionych redaktorów (Login : Hasło)
const JOURNALISTS = {
  'admin': 'haslo123',
  'redaktor': 'pilka2025',
  'kamera': 'wideo123'
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

  const now = Date.now();
  
  if (cache[ligaId] && (now - cache[ligaId].lastFetchTime < CACHE_TIME)) {
    return true;
  }
  
  if (fetchPromises[ligaId]) {
    await fetchPromises[ligaId];
    return true;
  }
  
  console.log(`🐌 Pobieram dane w locie dla [${ligaId}] z 90minut.pl...`);
  
  const currentTask = (async () => {
    const newData = await fetchFrom90Minut(targetUrl); 
    if (newData && newData.tabela.length > 0) {
      cache[ligaId] = { tabela: newData.tabela, mecze: newData.mecze, lastFetchTime: Date.now() };
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
    res.json(cache[ligaId]?.tabela || []);
  } catch(e) { 
    res.status(400).json({error: "Błąd ligi lub brak linku"}); 
  }
});

app.get('/api/mecze', async (req, res) => {
  const ligaId = req.query.liga || 'iv-liga';
  try {
    await ensureDataIsFresh(ligaId);
    console.log(`⚡ Oddaję MECZE dla [${ligaId}]`);
    res.json(cache[ligaId]?.mecze || []);
  } catch(e) { 
    res.status(400).json({error: "Błąd ligi lub brak linku"}); 
  }
});

// --- ENDPOINTY LOGOWANIA ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (JOURNALISTS[username] && JOURNALISTS[username] === password) {
    res.json({ success: true, username: username });
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
    res.json(docs.map(d => ({ id: d._id, title: d.title, content: d.content, author: d.author, date: d.date })));
  } catch (err) {
    res.status(500).json({ error: 'Błąd bazy danych' });
  }
});

app.post('/api/articles', async (req, res) => {
  const { title, content, author, password } = req.body;
  if (!JOURNALISTS[author] || JOURNALISTS[author] !== password) {
    return res.status(403).json({ error: 'Brak uprawnień do publikacji!' });
  }
  
  try {
    const newArticle = await Article.create({
      title, content, author, 
      date: new Date().toLocaleDateString('pl-PL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    });
    res.json({ success: true, article: { id: newArticle._id, title, content, author, date: newArticle.date } });
  } catch (err) {
    res.status(500).json({ error: 'Błąd podczas zapisu w bazie' });
  }
});

app.post('/api/articles/delete', async (req, res) => {
  const { id, author, password } = req.body;
  if (!JOURNALISTS[author] || JOURNALISTS[author] !== password) {
    return res.status(403).json({ error: 'Brak uprawnień!' });
  }
  
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
    res.json(docs.map(d => ({ id: d._id, title: d.title, embedUrl: d.embedUrl, author: d.author, date: d.date })));
  } catch (err) {
    res.status(500).json({ error: 'Błąd bazy danych' });
  }
});

app.post('/api/videos', async (req, res) => {
  const { title, embedUrl, author, password } = req.body;
  if (!JOURNALISTS[author] || JOURNALISTS[author] !== password) {
    return res.status(403).json({ error: 'Brak uprawnień!' });
  }
  
  try {
    const newVideo = await Video.create({
      title, embedUrl, author, 
      date: new Date().toLocaleDateString('pl-PL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    });
    res.json({ success: true, video: { id: newVideo._id, title, embedUrl, author, date: newVideo.date } });
  } catch (err) {
    res.status(500).json({ error: 'Błąd zapisu' });
  }
});

app.post('/api/videos/delete', async (req, res) => {
  const { id, author, password } = req.body;
  if (!JOURNALISTS[author] || JOURNALISTS[author] !== password) {
    return res.status(403).json({ error: 'Brak uprawnień!' });
  }
  
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
    res.json(docs.map(d => ({ id: d._id, title: d.title, embedUrl: d.embedUrl, author: d.author, date: d.date })));
  } catch (err) {
    res.status(500).json({ error: 'Błąd bazy danych' });
  }
});

app.post('/api/streams', async (req, res) => {
  const { title, embedUrl, author, password } = req.body;
  if (!JOURNALISTS[author] || JOURNALISTS[author] !== password) {
    return res.status(403).json({ error: 'Brak uprawnień!' });
  }
  
  try {
    const newStream = await Stream.create({
      title, embedUrl, author, 
      date: new Date().toLocaleDateString('pl-PL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    });
    res.json({ success: true, stream: { id: newStream._id, title, embedUrl, author, date: newStream.date } });
  } catch (err) {
    res.status(500).json({ error: 'Błąd zapisu' });
  }
});

app.post('/api/streams/delete', async (req, res) => {
  const { id, author, password } = req.body;
  if (!JOURNALISTS[author] || JOURNALISTS[author] !== password) {
    return res.status(403).json({ error: 'Brak uprawnień!' });
  }
  
  try {
    await Stream.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serwer działa na http://localhost:${PORT}`);
});