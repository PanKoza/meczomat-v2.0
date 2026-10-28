import API from './api';

// Wspólny cache danych lig (tabela / mecze) dla całej aplikacji.
// Dane z poprzedniej wizyty trzymamy w localStorage, żeby pokazać je od razu,
// a świeże pobieramy w tle. Równoległe zapytania o tę samą ligę są łączone w jedno.
const STORAGE_PREFIX = 'meczomat:liga:';
const memory = {};
const pending = {};

const keyOf = (type, leagueId) => `${type}:${leagueId}`;

export function getCachedLeague(type, leagueId) {
  const key = keyOf(type, leagueId);
  if (memory[key]) return memory[key];
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored) return (memory[key] = JSON.parse(stored));
  } catch { /* brak dostępu do storage */ }
  return null;
}

export function fetchLeague(type, leagueId) {
  const key = keyOf(type, leagueId);
  if (pending[key]) return pending[key];

  pending[key] = fetch(`${API}/api/${type}?liga=${leagueId}`)
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      if (Array.isArray(data)) {
        memory[key] = data;
        try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data)); } catch { /* pełny storage */ }
      }
      return data;
    })
    .finally(() => { delete pending[key]; });
  return pending[key];
}
