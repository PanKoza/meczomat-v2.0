import { useEffect, useState } from 'react';
import API from './api';
import { buildTeamIndex, LEAGUE_LIST } from './seo/shared';
import { fetchLeague } from './leagueData';

// Indeks wszystkich drużyn (nazwa, liga, slug) — jedno zapytanie do /api/druzyny na całą sesję.
let index = null;
let pending = null;

// Awaryjnie (np. starsza wersja API bez /api/druzyny) składamy listę z tabel poszczególnych lig
async function loadFromLeagueTables() {
  const all = [];
  const BATCH = 5;
  for (let i = 0; i < LEAGUE_LIST.length; i += BATCH) {
    const batch = LEAGUE_LIST.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map(l => fetchLeague('tabela', l.id)));
    results.forEach((r, j) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        r.value.forEach(row => all.push({ name: row.nazwa, leagueId: batch[j].id }));
      }
    });
  }
  return all;
}

export function loadTeamIndex() {
  if (index) return Promise.resolve(index);
  if (!pending) {
    pending = fetch(`${API}/api/druzyny`)
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(list => (Array.isArray(list) && list.length ? list : loadFromLeagueTables()))
      .then(list => {
        if (list.length) index = buildTeamIndex(list);
        return index;
      })
      .catch(() => null)
      .finally(() => { pending = null; });
  }
  return pending;
}

export function useTeamIndex() {
  const [idx, setIdx] = useState(index);
  useEffect(() => {
    if (idx) return;
    let alive = true;
    loadTeamIndex().then(i => { if (alive && i) setIdx(i); });
    return () => { alive = false; };
  }, [idx]);
  return idx;
}
