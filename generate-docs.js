const { chromium } = require('playwright');

const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1a1a2e; line-height: 1.6; }

  .cover {
    background: linear-gradient(135deg, #0d1b2a 0%, #1b2a40 50%, #0f3460 100%);
    color: white;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px;
    page-break-after: always;
  }
  .cover h1 { font-size: 42pt; font-weight: 900; letter-spacing: -1px; margin-bottom: 10px; }
  .cover h1 span { color: #00ff88; }
  .cover .subtitle { font-size: 16pt; color: rgba(255,255,255,0.6); margin-bottom: 40px; }
  .cover .badge {
    background: rgba(0,255,136,0.1);
    border: 1px solid rgba(0,255,136,0.3);
    color: #00ff88;
    padding: 8px 24px;
    border-radius: 30px;
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 60px;
  }
  .cover .meta { color: rgba(255,255,255,0.35); font-size: 9pt; }

  .toc-page {
    padding: 60px 70px;
    page-break-after: always;
  }
  .toc-page h2 { font-size: 20pt; font-weight: 800; color: #0f3460; border-bottom: 3px solid #00c46a; padding-bottom: 10px; margin-bottom: 30px; }
  .toc-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ccc; font-size: 10.5pt; }
  .toc-item .num { font-weight: 700; color: #0f3460; margin-right: 10px; }
  .toc-item .page-num { color: #888; }

  .chapter {
    padding: 50px 70px;
    page-break-before: always;
  }
  .chapter-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 30px;
    padding-bottom: 16px;
    border-bottom: 3px solid #0f3460;
  }
  .chapter-num {
    background: #0f3460;
    color: white;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16pt;
    font-weight: 900;
    flex-shrink: 0;
  }
  .chapter-title { font-size: 22pt; font-weight: 800; color: #0f3460; }

  h3 { font-size: 14pt; font-weight: 700; color: #0f3460; margin: 24px 0 10px; }
  h4 { font-size: 11pt; font-weight: 700; color: #1b2a40; margin: 16px 0 6px; }
  p { margin-bottom: 10px; color: #2d3748; }

  .info-box {
    background: #f0f7ff;
    border-left: 4px solid #0f3460;
    padding: 14px 18px;
    border-radius: 0 8px 8px 0;
    margin: 16px 0;
  }
  .info-box.green { background: #f0fff8; border-color: #00c46a; }
  .info-box.yellow { background: #fffbf0; border-color: #f59e0b; }
  .info-box.red { background: #fff5f5; border-color: #e53e3e; }
  .info-box strong { color: #0f3460; display: block; margin-bottom: 4px; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.5px; }

  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
  th { background: #0f3460; color: white; padding: 10px 12px; text-align: left; font-weight: 700; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  td code { background: #edf2f7; padding: 2px 6px; border-radius: 3px; font-size: 9pt; font-family: 'Courier New', monospace; color: #2d3748; }

  .code-block {
    background: #1a1a2e;
    color: #a8e6cf;
    padding: 16px 20px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    margin: 14px 0;
    white-space: pre-wrap;
    line-height: 1.8;
  }
  .code-block .comment { color: #6a9fb5; }
  .code-block .keyword { color: #f0a500; }
  .code-block .string { color: #88d8b0; }

  .flow-diagram {
    display: flex;
    align-items: center;
    gap: 0;
    margin: 20px 0;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .flow-box {
    background: #0f3460;
    color: white;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 9.5pt;
    font-weight: 700;
    text-align: center;
  }
  .flow-box.green { background: #00c46a; color: #0d1b2a; }
  .flow-box.orange { background: #f59e0b; color: #0d1b2a; }
  .flow-box.gray { background: #718096; }
  .flow-arrow { font-size: 18pt; color: #0f3460; padding: 0 4px; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 14px 0; }
  .card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px;
    background: white;
  }
  .card h4 { margin-top: 0; color: #0f3460; font-size: 11pt; }
  .card p { font-size: 9.5pt; color: #4a5568; margin: 0; }
  .card .icon { font-size: 22pt; margin-bottom: 6px; }

  ul { padding-left: 20px; margin: 8px 0; }
  li { margin-bottom: 5px; color: #2d3748; font-size: 10.5pt; }

  .endpoint {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 8px 0;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .method {
    padding: 3px 10px;
    border-radius: 5px;
    font-weight: 800;
    font-size: 8pt;
    letter-spacing: 1px;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .method.get { background: #c6f6d5; color: #276749; }
  .method.post { background: #bee3f8; color: #2a69ac; }
  .endpoint-path { font-family: 'Courier New', monospace; font-size: 10pt; color: #0f3460; font-weight: 700; }
  .endpoint-desc { font-size: 9.5pt; color: #4a5568; margin-top: 2px; }

  .warning-box {
    background: #fff5f5;
    border: 1px solid #fc8181;
    border-radius: 8px;
    padding: 14px 18px;
    margin: 16px 0;
    font-size: 10pt;
  }
  .warning-box strong { color: #c53030; }

  .step { display: flex; gap: 14px; margin: 12px 0; align-items: flex-start; }
  .step-num { background: #00c46a; color: #0d1b2a; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 10pt; flex-shrink: 0; }
  .step-content { flex: 1; }
  .step-content strong { font-size: 10.5pt; color: #0f3460; }
  .step-content p { font-size: 9.5pt; margin: 3px 0 0; }

  .badge-inline {
    display: inline-block;
    background: #e9f5ff;
    color: #0f3460;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 8.5pt;
    font-weight: 700;
    border: 1px solid #bee3f8;
  }
  .badge-inline.green { background: #f0fff8; color: #276749; border-color: #c6f6d5; }
  .badge-inline.red { background: #fff5f5; color: #c53030; border-color: #fc8181; }

  footer-note {
    display: block;
    text-align: center;
    font-size: 8.5pt;
    color: #a0aec0;
    padding: 20px;
    border-top: 1px solid #e2e8f0;
    margin-top: 40px;
  }
</style>
</head>
<body>

<!-- ============================== OKŁADKA ============================== -->
<div class="cover">
  <div class="badge">Dokumentacja Techniczna</div>
  <h1>meczo<span>mat</span>.pl</h1>
  <div class="subtitle">Dokumentacja projektu – wdrożenie nowego dewelopera</div>
  <div style="width:60px;height:3px;background:#00ff88;margin:30px auto;border-radius:2px;"></div>
  <div class="meta">
    Wersja: 2.0 &nbsp;·&nbsp; Maj 2026 &nbsp;·&nbsp; Projekt: Meczomat v2.0
  </div>
</div>

<!-- ============================== SPIS TREŚCI ============================== -->
<div class="toc-page">
  <h2>Spis treści</h2>

  <div class="toc-item"><span><span class="num">1.</span> Opis projektu i cel</span><span class="page-num">3</span></div>
  <div class="toc-item"><span><span class="num">2.</span> Architektura systemu – przegląd ogólny</span><span class="page-num">4</span></div>
  <div class="toc-item"><span><span class="num">3.</span> Backend – serwer Node.js (server.js)</span><span class="page-num">5</span></div>
  <div class="toc-item"><span><span class="num">4.</span> Baza danych – MongoDB Atlas</span><span class="page-num">7</span></div>
  <div class="toc-item"><span><span class="num">5.</span> Frontend – aplikacja React (meczomat2.0/)</span><span class="page-num">8</span></div>
  <div class="toc-item"><span><span class="num">6.</span> Omówienie plików frontendu</span><span class="page-num">9</span></div>
  <div class="toc-item"><span><span class="num">7.</span> API – lista wszystkich endpointów</span><span class="page-num">11</span></div>
  <div class="toc-item"><span><span class="num">8.</span> System CMS – panel redakcyjny</span><span class="page-num">12</span></div>
  <div class="toc-item"><span><span class="num">9.</span> Uruchomienie projektu lokalnie</span><span class="page-num">13</span></div>
  <div class="toc-item"><span><span class="num">10.</span> Deployment – produkcja</span><span class="page-num">14</span></div>
  <div class="toc-item"><span><span class="num">11.</span> Znane ograniczenia i TODO</span><span class="page-num">15</span></div>
</div>

<!-- ============================== ROZDZIAŁ 1 ============================== -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">1</div>
    <div class="chapter-title">Opis projektu i cel</div>
  </div>

  <p><strong>Meczomat.pl</strong> to serwis internetowy poświęcony wynikom i tabeli ligowej polskich rozgrywek piłkarskich – ze szczególnym naciskiem na <strong>niższe szczeble</strong> (IV liga, V liga, Klasa Okręgowa, A-Klasa), które są pomijane przez popularne portale sportowe.</p>

  <div class="info-box green">
    <strong>Główna idea</strong>
    Kibice małych, lokalnych klubów często nie mają dostępu do aktualnych wyników i tabeli swojej ligi w jednym miejscu. Meczomat.pl agreguje te dane automatycznie.
  </div>

  <h3>Funkcje dla użytkownika końcowego</h3>
  <div class="grid-2">
    <div class="card">
      <div class="icon">🏆</div>
      <h4>Tabele ligowe</h4>
      <p>Aktualne tabele z Ekstraklasy aż po A-Klasę – z podziałem na województwa i grupy.</p>
    </div>
    <div class="card">
      <div class="icon">📅</div>
      <h4>Terminarz meczów</h4>
      <p>Wyniki i harmonogram rozgrywek z podziałem na kolejki i daty.</p>
    </div>
    <div class="card">
      <div class="icon">⭐</div>
      <h4>Ulubiony klub</h4>
      <p>Użytkownik może zapisać swoją drużynę – serwis pokaże następny mecz i profil klubu.</p>
    </div>
    <div class="card">
      <div class="icon">📺</div>
      <h4>Centrum Kibica</h4>
      <p>Artykuły, skróty wideo z YouTube oraz transmisje live dla fanów niższych lig.</p>
    </div>
  </div>

  <h3>Docelowa grupa użytkowników</h3>
  <ul>
    <li>Kibice i zawodnicy drużyn grających w IV–A klasie rozgrywkowej</li>
    <li>Działacze i trenerzy lokalnych klubów</li>
    <li>Dziennikarze sportowi relacjonujący niższe ligi</li>
  </ul>
</div>

<!-- ============================== ROZDZIAŁ 2 ============================== -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">2</div>
    <div class="chapter-title">Architektura systemu – przegląd ogólny</div>
  </div>

  <p>Projekt jest podzielony na dwa niezależne komponenty: <strong>backend</strong> (serwer API) i <strong>frontend</strong> (aplikacja React). Komunikują się przez REST API przez sieć.</p>

  <div class="flow-diagram">
    <div class="flow-box">90minut.pl<br><small style="font-weight:400;font-size:8pt">Źródło danych</small></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box orange">server.js<br><small style="font-weight:400;font-size:8pt">Node.js / Express</small></div>
    <div class="flow-arrow">↔</div>
    <div class="flow-box gray">MongoDB Atlas<br><small style="font-weight:400;font-size:8pt">Baza danych CMS</small></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box green">React App<br><small style="font-weight:400;font-size:8pt">Przeglądarka</small></div>
  </div>

  <div style="text-align:center;font-size:8.5pt;color:#718096;margin-top:-8px;margin-bottom:20px;">
    Rysunek 1. Przepływ danych w systemie
  </div>

  <h3>Struktura katalogów projektu</h3>
  <table>
    <tr><th>Ścieżka</th><th>Opis</th></tr>
    <tr><td><code>server.js</code></td><td>Główny plik backendu – serwer Express, scraping, API</td></tr>
    <tr><td><code>package.json</code> (root)</td><td>Zależności backendu (express, mongoose, cheerio…)</td></tr>
    <tr><td><code>meczomat2.0/</code></td><td>Cały frontend React + Vite + Tailwind CSS</td></tr>
    <tr><td><code>meczomat2.0/src/App.jsx</code></td><td>Główny komponent React – nawigacja, widoki, kreator lig</td></tr>
    <tr><td><code>meczomat2.0/src/LeagueTable.jsx</code></td><td>Komponent tabeli ligowej</td></tr>
    <tr><td><code>meczomat2.0/src/MatchList.jsx</code></td><td>Komponent listy meczów / terminarza</td></tr>
    <tr><td><code>meczomat2.0/src/TeamSearch.jsx</code></td><td>Wyszukiwarka i profil drużyny</td></tr>
    <tr><td><code>meczomat2.0/src/CmsPanel.jsx</code></td><td>Panel redakcyjny (CMS) dla dziennikarzy</td></tr>
    <tr><td><code>meczomat2.0/src/PublicNews.jsx</code></td><td>Centrum Kibica – publiczne artykuły i wideo</td></tr>
  </table>

  <div class="info-box yellow">
    <strong>Ważne</strong>
    Backend i frontend to dwa <em>osobne projekty Node.js</em> z osobnymi plikami <code>package.json</code>. Każdy uruchamia się niezależnie. Do produkcji backend jest hostowany na Render.com, frontend na Netlify/Vercel lub podobnym.
  </div>

  <h3>Technologie użyte w projekcie</h3>
  <table>
    <tr><th>Warstwa</th><th>Technologia</th><th>Wersja</th><th>Zastosowanie</th></tr>
    <tr><td>Backend runtime</td><td>Node.js</td><td>—</td><td>Środowisko uruchomieniowe serwera</td></tr>
    <tr><td>Backend framework</td><td>Express.js</td><td>^5.2</td><td>Routing HTTP i middleware</td></tr>
    <tr><td>Web scraping</td><td>axios + cheerio</td><td>^1.15 / ^1.2</td><td>Pobieranie i parsowanie HTML z 90minut.pl</td></tr>
    <tr><td>Kodowanie znaków</td><td>iconv-lite</td><td>^0.7</td><td>Konwersja ISO-8859-2 → UTF-8</td></tr>
    <tr><td>Baza danych</td><td>MongoDB + Mongoose</td><td>^9.4</td><td>Przechowywanie artykułów, wideo, streamów</td></tr>
    <tr><td>Frontend framework</td><td>React</td><td>^19.2</td><td>Interfejs użytkownika (SPA)</td></tr>
    <tr><td>Build tool</td><td>Vite</td><td>^8.0</td><td>Bundlowanie i dev server frontendu</td></tr>
    <tr><td>Stylowanie</td><td>Tailwind CSS</td><td>^4.2</td><td>Utility-first CSS</td></tr>
  </table>
</div>

<!-- ============================== ROZDZIAŁ 3 ============================== -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">3</div>
    <div class="chapter-title">Backend – serwer Node.js (server.js)</div>
  </div>

  <p>Plik <code>server.js</code> to <strong>jednorazowy monolit</strong> – jeden plik obsługuje całe API. Uruchamia się jako serwer HTTP na porcie 3001 (domyślny) lub na porcie ze zmiennej środowiskowej <code>PORT</code>.</p>

  <h3>Słownik lig (LEAGUES)</h3>
  <p>Na samej górze pliku zdefiniowany jest słownik mapujący identyfikator ligi na URL strony 90minut.pl:</p>
  <div class="code-block"><span class="keyword">const</span> LEAGUES = {
  <span class="string">'ekstraklasa'</span>: <span class="string">'http://www.90minut.pl/liga/1/liga14072.html'</span>,
  <span class="string">'1-liga'</span>:     <span class="string">'http://www.90minut.pl/liga/1/liga14073.html'</span>,
  <span class="string">'iv-liga'</span>:    <span class="string">'http://www.90minut.pl/liga/1/liga14169.html'</span>,
  <span class="comment">// ... inne ligi</span>
  <span class="string">'a-klasa'</span>:    <span class="string">'TUTAJ_WKLEJ_LINK_Z_90MINUT'</span>  <span class="comment">// ← do uzupełnienia!</span>
};</div>

  <div class="info-box yellow">
    <strong>Jak dodać nową ligę?</strong>
    1. Wejdź na 90minut.pl, znajdź stronę ligi. 2. Skopiuj URL (musi zawierać <code>liga\d+.html</code>). 3. Dodaj nowy klucz do obiektu <code>LEAGUES</code>. 4. Odpowiednio uzupełnij <code>LEAGUE_STRUCTURE</code> w <code>App.jsx</code>.
  </div>

  <h3>Mechanizm scrapingu – fetchFrom90Minut()</h3>
  <p>To najważniejsza funkcja w projekcie. Pobiera stronę HTML z 90minut.pl i parsuje ją:</p>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-content">
      <strong>Pobranie HTML</strong>
      <p>Używa <code>axios.get(url, { responseType: 'arraybuffer' })</code> – pobiera surowe bajty (strona używa kodowania ISO-8859-2, nie UTF-8).</p>
    </div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-content">
      <strong>Konwersja kodowania</strong>
      <p><code>iconv.decode(response.data, 'iso-8859-2')</code> – zamienia polskie znaki zakodowane w starym standardzie.</p>
    </div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-content">
      <strong>Parsowanie tabeli</strong>
      <p>Cheerio (<code>jQuery po stronie serwera</code>) szuka elementu <code>table.main2</code> i odczytuje wiersze: pozycja, nazwa klubu, mecze, punkty, Z/R/P, bramki.</p>
    </div>
  </div>
  <div class="step">
    <div class="step-num">4</div>
    <div class="step-content">
      <strong>Parsowanie meczów</strong>
      <p>Szuka elementów <code>table.main</code>. Wyodrębnia kolejki (nagłówki „Kolejka X") i wiersze z mecz: gospodarz, wynik, gość, data. Mecze bez wyniku (<code>-</code>) oznacza jako <code>'Nierozegrany'</code>.</p>
    </div>
  </div>
  <div class="step">
    <div class="step-num">5</div>
    <div class="step-content">
      <strong>Zwraca obiekt</strong>
      <p>Funkcja zwraca <code>{ tabela: [...], mecze: [...] }</code> gotowy do oddania klientowi.</p>
    </div>
  </div>

  <h3>System cache'u</h3>
  <p>Dane z 90minut.pl są cache'owane w pamięci serwera na <strong>15 minut</strong>, aby nie przeciążać serwisu i przyspieszyć odpowiedzi:</p>
  <table>
    <tr><th>Zmienna</th><th>Typ</th><th>Opis</th></tr>
    <tr><td><code>cache</code></td><td>Obiekt</td><td>Słownik <code>{ ligaId → { tabela, mecze, lastFetchTime } }</code></td></tr>
    <tr><td><code>fetchPromises</code></td><td>Obiekt</td><td>Deduplikacja równoległych requestów – jeśli ktoś pyta o tę samą ligę, czeka na już trwające pobieranie</td></tr>
    <tr><td><code>CACHE_TIME</code></td><td>Number</td><td>15 minut (15 * 60 * 1000 ms)</td></tr>
  </table>

  <div class="info-box">
    <strong>Ważna uwaga</strong>
    Cache jest przechowywany <em>tylko w RAM</em> serwera. Po restarcie serwera cache jest pusty i pierwsze zapytanie każdej ligi spowoduje fetch z 90minut.pl (może trwać kilka sekund).
  </div>

  <h3>Lista redaktorów (JOURNALISTS)</h3>
  <p>Uprawnienia do CMS są hardcodowane w pliku serwera jako zwykły obiekt:</p>
  <div class="code-block"><span class="keyword">const</span> JOURNALISTS = {
  <span class="string">'admin'</span>:    <span class="string">'haslo123'</span>,
  <span class="string">'redaktor'</span>: <span class="string">'pilka2025'</span>,
  <span class="string">'kamera'</span>:   <span class="string">'wideo123'</span>
};</div>

  <div class="warning-box">
    <strong>⚠ Uwaga bezpieczeństwa!</strong> Hasła są przechowywane jako plain text. W przyszłości należy wdrożyć haszowanie (bcrypt) i JWT do autoryzacji. Tymczasowo rozwiązanie jest wystarczające dla małego zespołu redakcyjnego.
  </div>
</div>

<!-- ============================== ROZDZIAŁ 4 ============================== -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">4</div>
    <div class="chapter-title">Baza danych – MongoDB Atlas</div>
  </div>

  <p>Baza danych przechowuje wyłącznie treści CMS (artykuły, wideo, transmisje). Wyniki sportowe <strong>nie są zapisywane</strong> w bazie – są pobierane na żywo ze scrapingu.</p>

  <h3>Połączenie</h3>
  <p>Serwer łączy się z chmurową bazą MongoDB Atlas przy starcie:</p>
  <div class="code-block">mongoose.connect(<span class="string">'mongodb+srv://PanKoza:...@cluster0.ijaep7g.mongodb.net/'</span>)</div>

  <div class="warning-box">
    <strong>⚠ String połączenia jest na razie hardcoded w pliku!</strong> Docelowo powinien być w zmiennej środowiskowej <code>.env</code>. Nigdy nie commituj hasła do repozytorium!
  </div>

  <h3>Modele danych (Mongoose Schemas)</h3>
  <table>
    <tr><th>Kolekcja</th><th>Pola</th><th>Opis</th></tr>
    <tr>
      <td><code>articles</code></td>
      <td><code>title, content, author, date</code></td>
      <td>Artykuły redakcyjne, np. relacja z meczu. Pole <code>content</code> to długi tekst.</td>
    </tr>
    <tr>
      <td><code>videos</code></td>
      <td><code>title, embedUrl, author, date</code></td>
      <td>Skróty wideo. <code>embedUrl</code> to przetworzony link YouTube embed (np. <code>youtube.com/embed/XXXX</code>).</td>
    </tr>
    <tr>
      <td><code>streams</code></td>
      <td><code>title, embedUrl, author, date</code></td>
      <td>Transmisje na żywo. Identyczna struktura jak wideo.</td>
    </tr>
  </table>

  <p>Każdy dokument ma także autogenerowane pola <code>_id</code> i <code>createdAt</code> / <code>updatedAt</code> (dzięki opcji <code>{ timestamps: true }</code>).</p>

  <h3>Jak dodać nowe konto redaktora?</h3>
  <div class="step">
    <div class="step-num">1</div>
    <div class="step-content">
      <strong>Otwórz plik server.js</strong>
      <p>Znajdź obiekt <code>JOURNALISTS</code> na początku pliku.</p>
    </div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-content">
      <strong>Dodaj nowy wpis</strong>
      <p>Dopisz linię: <code>'nowy_redaktor': 'silne_haslo'</code></p>
    </div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-content">
      <strong>Zrestartuj serwer</strong>
      <p>Nowy redaktor może się zalogować w panelu CMS.</p>
    </div>
  </div>
</div>

<!-- ============================== ROZDZIAŁ 5 ============================== -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">5</div>
    <div class="chapter-title">Frontend – aplikacja React (meczomat2.0/)</div>
  </div>

  <p>Frontend to <strong>Single Page Application (SPA)</strong> zbudowana w React 19 z Vite jako bundlerem i Tailwind CSS do stylowania. Wszystkie strony renderują się po stronie klienta (CSR).</p>

  <h3>Struktura nawigacji (widoki)</h3>
  <p>Aplikacja nie używa React Router – stan <code>currentView</code> w <code>App.jsx</code> decyduje o tym, co jest wyświetlane:</p>
  <table>
    <tr><th>Wartość currentView</th><th>Co wyświetla</th><th>Komponent</th></tr>
    <tr><td><code>'home'</code></td><td>Strona główna z widgetem ulubionej drużyny, nowościami i wyszukiwarką globalną</td><td>Wbudowane w App.jsx</td></tr>
    <tr><td><code>'leagues'</code></td><td>Kreator wyboru ligi, tabela, mecze i profil drużyny</td><td>LeagueTable, MatchList, TeamSearch</td></tr>
    <tr><td><code>'news'</code></td><td>Centrum Kibica – artykuły, wideo, transmisje</td><td>PublicNews</td></tr>
    <tr><td><code>'cms'</code></td><td>Panel CMS dla redaktorów (wymaga logowania)</td><td>CmsPanel</td></tr>
  </table>

  <h3>Kreator wyboru ligi (Wizard)</h3>
  <p>Widok „Rozgrywki" to kreator krokowy prowadzący użytkownika przez wybór ligi. Sterowany zmienną <code>wizardStep</code>:</p>
  <table>
    <tr><th>Krok</th><th>Co się dzieje</th></tr>
    <tr><td><strong>Krok 1</strong></td><td>Wybór szczebla rozgrywek: Ekstraklasa, I Liga, … A-Klasa</td></tr>
    <tr><td><strong>Krok 2</strong></td><td>Wybór województwa (tylko dla lig regionalnych: IV liga i niżej)</td></tr>
    <tr><td><strong>Krok 3</strong></td><td>Wybór grupy (np. dla III ligi: Grupa I–IV; dla okręgówki: grupy regionalne)</td></tr>
    <tr><td><strong>Krok 4</strong></td><td>Wyświetlenie tabeli i meczów wybranej ligi</td></tr>
  </table>

  <div class="info-box">
    <strong>Pomijanie kroków</strong>
    Jeśli szczebel krajowy ma tylko jedną grupę (np. Ekstraklasa), wizard przeskakuje od razu do kroku 4. Jeśli województwo ma tylko jedną grupę danego szczebla – podobnie.
  </div>

  <h3>Ulubiona drużyna</h3>
  <p>Użytkownik może kliknąć gwiazdkę ★ przy dowolnej drużynie. Klub zapisuje się w <code>localStorage</code> pod kluczem <code>meczomat_fav_obj</code>. Przy każdym wejściu na stronę aplikacja automatycznie ładuje następny mecz tej drużyny.</p>

  <h3>Globalna wyszukiwarka drużyn</h3>
  <p>Po załadowaniu aplikacja w tle pobiera dane <strong>wszystkich lig</strong> i buduje słownik wszystkich drużyn (<code>globalTeams</code>). Dzięki temu wyszukiwarka na stronie głównej działa globalnie – wpisując nazwę klubu możesz znaleźć go w dowolnej lidze.</p>

  <div class="info-box yellow">
    <strong>Wydajność</strong>
    Globalne pobieranie wszystkich lig przy starcie może generować wiele równoległych requestów do API. Jeśli serwer ma cold start (np. po uśpieniu na Render.com), pierwsze ładowanie strony może trwać 10–30 sekund.
  </div>
</div>

<!-- ============================== ROZDZIAŁ 6 ============================== -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">6</div>
    <div class="chapter-title">Omówienie plików frontendu</div>
  </div>

  <h3>App.jsx – główny komponent</h3>
  <p>Serce aplikacji. Zarządza globalnym stanem, nawigacją i komunikacją między komponentami. Zawiera:</p>
  <ul>
    <li>Stałą <code>LEAGUE_STRUCTURE</code> – hierarchiczny słownik wszystkich lig dostępnych w serwisie</li>
    <li>Stałą <code>WIZARD_LEVELS</code> – lista szczebli rozgrywkowych do kreatora</li>
    <li>Logikę <code>useEffect</code> ładującą: ulubioną drużynę z localStorage, najnowsze treści CMS, wszystkie drużyny globalnie</li>
    <li>Render warunkowy widoków (home / leagues / news / cms)</li>
    <li>Komponent nawigacji (sticky navbar)</li>
  </ul>

  <h3>LeagueTable.jsx – tabela ligowa</h3>
  <p>Prosty komponent przyjmujący prop <code>leagueId</code>. Pobiera tabelę z <code>/api/tabela?liga={leagueId}</code> i renderuje ją w stylowej tabeli HTML. Obsługuje:
  </p>
  <ul>
    <li>Stan ładowania (spinner)</li>
    <li>Podświetlanie ulubionej drużyny</li>
    <li>Responsywne ukrywanie kolumn na mobile (hidden md:table-cell)</li>
    <li>Klikanie w gwiazdkę ★ do zapisywania ulubionego klubu</li>
  </ul>

  <h3>MatchList.jsx – lista meczów</h3>
  <p>Pobiera mecze z <code>/api/mecze?liga={leagueId}</code>. Wyświetla rozgrywki pogrupowane po kolejkach. Rozróżnia mecze zakończone (pokazuje wynik) i zaplanowane (pokazuje datę i godzinę).</p>

  <h3>TeamSearch.jsx – wyszukiwarka i profil drużyny</h3>
  <p>Komponent z podwójną funkcją:</p>
  <ul>
    <li><strong>Wyszukiwarka</strong> – filtruje listę <code>globalTeams</code> po wpisanej frazie; kliknięcie przełącza aktywną ligę i otwiera profil drużyny</li>
    <li><strong>Profil drużyny</strong> – po wyborze drużyny pokazuje jej 5 ostatnich wyników (Z/R/P) i pełen terminarz meczów w danej lidze</li>
  </ul>

  <h3>CmsPanel.jsx – panel redakcyjny</h3>
  <p>Panel dla zalogowanych dziennikarzy. Opisany szczegółowo w rozdziale 8.</p>

  <h3>PublicNews.jsx – Centrum Kibica</h3>
  <p>Publiczny widok treści z CMS. Trzy zakładki: Wiadomości, Skróty Wideo, Transmisje. Transmisje wyróżnione czerwonym wskaźnikiem LIVE z animacją pulsowania. Embeduje filmy bezpośrednio przez iframe YouTube.</p>

  <h3>Stylowanie – Tailwind CSS + klasy własne</h3>
  <p>Projekt używa customowego motywu ciemnego (dark mode). W plikach CSS zdefiniowane są klasy pomocnicze:</p>
  <table>
    <tr><th>Klasa CSS</th><th>Opis</th></tr>
    <tr><td><code>glass-card</code></td><td>Szklany efekt karty z przezroczystością i rozmyciem tła</td></tr>
    <tr><td><code>glass-nav</code></td><td>Wersja dla paska nawigacji (sticky)</td></tr>
    <tr><td><code>glass-surface</code></td><td>Lekka szklana powierzchnia wewnątrz kart</td></tr>
    <tr><td><code>brand-accent</code></td><td>Kolor akcentu – jaskrawa zieleń <code>#00ff88</code></td></tr>
    <tr><td><code>brand-cream</code></td><td>Główny kolor tekstu – kremowy biały</td></tr>
    <tr><td><code>animate-fade-in</code></td><td>Płynne pojawienie się elementu</td></tr>
    <tr><td><code>animate-slide-up</code></td><td>Wjazd elementu od dołu</td></tr>
  </table>
</div>

<!-- ============================== ROZDZIAŁ 7 ============================== -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">7</div>
    <div class="chapter-title">API – lista wszystkich endpointów</div>
  </div>

  <p>Serwer nasłuchuje pod adresem produkcyjnym <code>https://meczomat-api.onrender.com</code>. Lokalnie: <code>http://localhost:3001</code>.</p>

  <h3>Endpointy danych sportowych</h3>

  <div class="endpoint">
    <span class="method get">GET</span>
    <div>
      <div class="endpoint-path">/api/tabela?liga={ligaId}</div>
      <div class="endpoint-desc">Zwraca tablicę obiektów tabeli ligowej dla podanej ligi. Odświeża cache co 15 min ze scrapingu 90minut.pl.</div>
    </div>
  </div>

  <div class="endpoint">
    <span class="method get">GET</span>
    <div>
      <div class="endpoint-path">/api/mecze?liga={ligaId}</div>
      <div class="endpoint-desc">Zwraca tablicę meczów (zakończonych i zaplanowanych) z terminarzem i wynikami dla podanej ligi.</div>
    </div>
  </div>

  <h3>Endpointy autoryzacji</h3>

  <div class="endpoint">
    <span class="method post">POST</span>
    <div>
      <div class="endpoint-path">/api/login</div>
      <div class="endpoint-desc">Logowanie do CMS. Body: <code>{ username, password }</code>. Zwraca <code>{ success: true, username }</code> lub 401.</div>
    </div>
  </div>

  <h3>Endpointy artykułów</h3>

  <div class="endpoint">
    <span class="method get">GET</span>
    <div>
      <div class="endpoint-path">/api/articles</div>
      <div class="endpoint-desc">Pobiera wszystkie artykuły z bazy MongoDB, posortowane od najnowszego.</div>
    </div>
  </div>

  <div class="endpoint">
    <span class="method post">POST</span>
    <div>
      <div class="endpoint-path">/api/articles</div>
      <div class="endpoint-desc">Dodaje nowy artykuł. Body: <code>{ title, content, author, password }</code>. Wymaga prawidłowego loginu/hasła z JOURNALISTS.</div>
    </div>
  </div>

  <div class="endpoint">
    <span class="method post">POST</span>
    <div>
      <div class="endpoint-path">/api/articles/delete</div>
      <div class="endpoint-desc">Usuwa artykuł po ID. Body: <code>{ id, author, password }</code>. Wymaga uprawnień.</div>
    </div>
  </div>

  <h3>Endpointy wideo i transmisji (analogiczna struktura)</h3>
  <table>
    <tr><th>Endpoint</th><th>Metoda</th><th>Opis</th></tr>
    <tr><td><code>/api/videos</code></td><td>GET</td><td>Pobierz wszystkie wideo</td></tr>
    <tr><td><code>/api/videos</code></td><td>POST</td><td>Dodaj wideo (wymaga loginu)</td></tr>
    <tr><td><code>/api/videos/delete</code></td><td>POST</td><td>Usuń wideo (wymaga loginu)</td></tr>
    <tr><td><code>/api/streams</code></td><td>GET</td><td>Pobierz wszystkie transmisje</td></tr>
    <tr><td><code>/api/streams</code></td><td>POST</td><td>Dodaj transmisję (wymaga loginu)</td></tr>
    <tr><td><code>/api/streams/delete</code></td><td>POST</td><td>Usuń transmisję (wymaga loginu)</td></tr>
  </table>

  <div class="info-box">
    <strong>Format odpowiedzi</strong>
    Wszystkie endpointy zwracają JSON. Błędy zwracają odpowiedni kod HTTP (400, 401, 403, 500) z obiektem <code>{ error: "..." }</code>.
  </div>
</div>

<!-- ============================== ROZDZIAŁ 8 ============================== -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">8</div>
    <div class="chapter-title">System CMS – panel redakcyjny</div>
  </div>

  <p>CMS (Content Management System) to wbudowany panel administracyjny dostępny z menu „⚙️ CMS". Umożliwia dziennikarzom/redaktorom publikowanie treści bez znajomości programowania.</p>

  <h3>Logowanie</h3>
  <p>Panel wymaga podania loginu i hasła. Dane są sprawdzane na serwerze przez endpoint <code>/api/login</code>. Po zalogowaniu credentiale zapisywane są w <code>localStorage</code> – użytkownik pozostaje zalogowany po odświeżeniu strony.</p>

  <h3>Dostępne konta (produkcja)</h3>
  <table>
    <tr><th>Login</th><th>Hasło</th><th>Przeznaczenie</th></tr>
    <tr><td><code>admin</code></td><td><code>haslo123</code></td><td>Administrator</td></tr>
    <tr><td><code>redaktor</code></td><td><code>pilka2025</code></td><td>Redaktor artykułów</td></tr>
    <tr><td><code>kamera</code></td><td><code>wideo123</code></td><td>Operator wideo</td></tr>
  </table>

  <h3>Typy treści w CMS</h3>

  <div class="grid-2">
    <div class="card">
      <div class="icon">📰</div>
      <h4>Artykuły</h4>
      <p>Tytuł + treść (długi tekst). Pojawia się w zakładce „Wiadomości" w Centrum Kibica. Wyświetlany z formatowaniem white-space: pre-wrap (respektuje Enter).</p>
    </div>
    <div class="card">
      <div class="icon">🎥</div>
      <h4>Skróty Wideo</h4>
      <p>Tytuł + link YouTube. Panel automatycznie przetwarza link na embed URL. Wyświetlane jako osadzone wideo w zakładce „Skróty Wideo".</p>
    </div>
    <div class="card">
      <div class="icon">🔴</div>
      <h4>Transmisje Live</h4>
      <p>Tytuł + link YouTube Live. Identyczne z wideo, ale wyświetlane w osobnej zakładce „Transmisje" z czerwonym wskaźnikiem LIVE.</p>
    </div>
    <div class="card">
      <div class="icon">🗑️</div>
      <h4>Usuwanie treści</h4>
      <p>Każdy zalogowany redaktor może usunąć dowolną treść (artykuł, wideo, stream) przyciskiem kosza w panelu CMS.</p>
    </div>
  </div>

  <h3>Jak opublikować artykuł – krok po kroku</h3>
  <div class="step">
    <div class="step-num">1</div>
    <div class="step-content"><strong>Wejdź w ⚙️ CMS</strong><p>Kliknij przycisk CMS w górnym menu.</p></div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-content"><strong>Zaloguj się</strong><p>Podaj login i hasło z tabeli powyżej.</p></div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-content"><strong>Wybierz zakładkę</strong><p>Artykuły / Skróty Wideo / Transmisje – w zależności od typu treści.</p></div>
  </div>
  <div class="step">
    <div class="step-num">4</div>
    <div class="step-content"><strong>Wypełnij formularz i kliknij Opublikuj</strong><p>Treść natychmiast pojawi się w Centrum Kibica dla wszystkich użytkowników.</p></div>
  </div>
</div>

<!-- ============================== ROZDZIAŁ 9 ============================== -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">9</div>
    <div class="chapter-title">Uruchomienie projektu lokalnie</div>
  </div>

  <h3>Wymagania wstępne</h3>
  <ul>
    <li>Node.js w wersji 18+ (zalecane 20 LTS)</li>
    <li>npm w wersji 9+</li>
    <li>Dostęp do internetu (scraping 90minut.pl + MongoDB Atlas)</li>
  </ul>

  <h3>Uruchomienie backendu</h3>
  <div class="code-block"><span class="comment"># W katalogu głównym projektu (meczomat_v2.0/)</span>
npm install
node server.js

<span class="comment"># Serwer startuje na http://localhost:3001</span>
<span class="comment"># Oczekiwany log: ✅ Serwer działa na http://localhost:3001</span>
<span class="comment"># Oczekiwany log: 📦 Sukces! Połączono z chmurową bazą MongoDB!</span></div>

  <h3>Uruchomienie frontendu</h3>
  <div class="code-block"><span class="comment"># W katalogu meczomat2.0/</span>
cd meczomat2.0
npm install
npm run dev

<span class="comment"># Frontend startuje na http://localhost:5173</span></div>

  <div class="info-box yellow">
    <strong>Uwaga – adres API w kodzie frontendu</strong>
    Frontend jest na razie skonfigurowany tak, że <strong>zawsze</strong> komunikuje się z produkcyjnym API (<code>https://meczomat-api.onrender.com</code>), nawet lokalnie. Jeśli chcesz testować z lokalnym backendem, musisz zmienić adresy URL we wszystkich komponentach React na <code>http://localhost:3001</code>.
  </div>

  <h3>Polecenia npm – podsumowanie</h3>
  <table>
    <tr><th>Katalog</th><th>Komenda</th><th>Opis</th></tr>
    <tr><td>root</td><td><code>node server.js</code></td><td>Uruchamia serwer API na porcie 3001</td></tr>
    <tr><td>meczomat2.0/</td><td><code>npm run dev</code></td><td>Dev server frontendu z hot reload (port 5173)</td></tr>
    <tr><td>meczomat2.0/</td><td><code>npm run build</code></td><td>Buduje statyczny bundle do folderu <code>dist/</code></td></tr>
    <tr><td>meczomat2.0/</td><td><code>npm run preview</code></td><td>Podgląd zbudowanego bundle'u lokalnie</td></tr>
    <tr><td>meczomat2.0/</td><td><code>npm run lint</code></td><td>Uruchamia ESLint na kodzie frontendu</td></tr>
  </table>
</div>

<!-- ============================== ROZDZIAŁ 10 ============================== -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">10</div>
    <div class="chapter-title">Deployment – produkcja</div>
  </div>

  <h3>Backend – Render.com</h3>
  <p>Serwer Node.js jest wdrożony na platformie <strong>Render.com</strong> jako Web Service.</p>
  <table>
    <tr><th>Parametr</th><th>Wartość</th></tr>
    <tr><td>Adres produkcyjny</td><td><code>https://meczomat-api.onrender.com</code></td></tr>
    <tr><td>Runtime</td><td>Node.js</td></tr>
    <tr><td>Start command</td><td><code>node server.js</code></td></tr>
    <tr><td>Plan</td><td>Free (uśpienie po 15 min bezczynności)</td></tr>
  </table>

  <div class="info-box yellow">
    <strong>Cold Start</strong>
    Serwer na darmowym planie Render.com zasypia po 15 minutach braku ruchu. Pierwsze żądanie po uśpieniu powoduje cold start trwający 30–60 sekund. Użytkownicy mogą widzieć ładowanie przy pierwszym wejściu.
  </div>

  <h3>Frontend – Netlify / Vercel</h3>
  <p>Zbudowany bundle React (folder <code>dist/</code>) można hostować na dowolnym hostingu statycznym. Zalecaną opcją jest Netlify lub Vercel z automatycznym deploymentem z repozytorium Git.</p>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-content">
      <strong>Build frontendu</strong>
      <p>W katalogu <code>meczomat2.0/</code> uruchom <code>npm run build</code> → powstaje folder <code>dist/</code>.</p>
    </div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-content">
      <strong>Upload do Netlify</strong>
      <p>Przeciągnij folder <code>dist/</code> na panel Netlify lub podłącz repozytorium Git z build command <code>npm run build</code> i publish directory <code>meczomat2.0/dist</code>.</p>
    </div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-content">
      <strong>Konfiguracja SPA routing</strong>
      <p>Dodaj plik <code>meczomat2.0/public/_redirects</code> z zawartością: <code>/* /index.html 200</code> (dla Netlify), lub <code>vercel.json</code> z rewrites dla Vercel.</p>
    </div>
  </div>

  <h3>Zmienne środowiskowe (TODO)</h3>
  <p>Rekomendowane przeniesienie wrażliwych danych z kodu do zmiennych środowiskowych na Render.com:</p>
  <table>
    <tr><th>Zmienna</th><th>Wartość</th><th>Gdzie ustawić</th></tr>
    <tr><td><code>MONGO_URI</code></td><td>String połączenia MongoDB Atlas</td><td>Render.com → Environment</td></tr>
    <tr><td><code>PORT</code></td><td>3001 (ustawiane automatycznie przez Render)</td><td>Render.com → Environment</td></tr>
  </table>
</div>

<!-- ============================== ROZDZIAŁ 11 ============================== -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">11</div>
    <div class="chapter-title">Znane ograniczenia i TODO</div>
  </div>

  <h3>Ograniczenia obecnego rozwiązania</h3>
  <table>
    <tr><th>Problem</th><th>Priorytet</th><th>Opis</th></tr>
    <tr>
      <td>Hasła plain text</td>
      <td><span class="badge-inline red">Wysoki</span></td>
      <td>Hasła redaktorów i MongoDB URI są wpisane wprost w kodzie. Należy użyć <code>.env</code> i bcrypt.</td>
    </tr>
    <tr>
      <td>Brak JWT / sesji</td>
      <td><span class="badge-inline red">Wysoki</span></td>
      <td>Autoryzacja CMS opiera się na porównaniu hasła per request. Brak tokenów sesji.</td>
    </tr>
    <tr>
      <td>Cache tylko w RAM</td>
      <td><span class="badge-inline">Średni</span></td>
      <td>Po restarcie serwera cache jest pusty. Warto rozważyć Redis do trwałego cache'u.</td>
    </tr>
    <tr>
      <td>Hardcodowane URL API</td>
      <td><span class="badge-inline">Średni</span></td>
      <td>Frontend używa produkcyjnego URL nawet lokalnie. Należy dodać plik <code>.env</code> z <code>VITE_API_URL</code>.</td>
    </tr>
    <tr>
      <td>Brak obsługi błędów 90minut</td>
      <td><span class="badge-inline">Niski</span></td>
      <td>Jeśli 90minut.pl zmieni strukturę HTML, scraping przestanie działać bez żadnych alertów.</td>
    </tr>
    <tr>
      <td>Ligi „do uzupełnienia"</td>
      <td><span class="badge-inline">Niski</span></td>
      <td>A-Klasa i IV liga opolska mają placeholder <code>TUTAJ_WKLEJ_LINK_Z_90MINUT</code>.</td>
    </tr>
    <tr>
      <td>Brak React Router</td>
      <td><span class="badge-inline">Niski</span></td>
      <td>Nawigacja przez stan React – brak deep linking (URL nie zmienia się przy przełączaniu widoków).</td>
    </tr>
  </table>

  <h3>Sugestie rozwoju</h3>
  <ul>
    <li>Przenieść MONGO_URI i hasła do zmiennych środowiskowych (<code>.env</code>)</li>
    <li>Wdrożyć JWT do autoryzacji CMS</li>
    <li>Dodać React Router dla lepszego SEO i deep linkowania</li>
    <li>Dodać monitoring scrapingu (alerty gdy tabela jest pusta)</li>
    <li>Rozważyć SSR (Next.js) dla lepszego SEO wyników ligowych</li>
    <li>Uzupełnić brakujące ligi (A-Klasa, IV liga opolska)</li>
  </ul>

  <footer-note>
    Meczomat.pl v2.0 · Dokumentacja wewnętrzna · Wygenerowano: Maj 2026
  </footer-note>
</div>

</body>
</html>`;

(async () => {
  console.log('Uruchamiam przeglądarkę...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setContent(html, { waitUntil: 'networkidle' });
  
  await page.pdf({
    path: 'dokumentacja_meczomat.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  
  await browser.close();
  console.log('✅ PDF wygenerowany: dokumentacja_meczomat.pdf');
})();
