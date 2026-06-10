// Cliente del lado servidor para API-Football (api-sports.io v3).
// La key NUNCA se expone al browser: solo se usa en las rutas /api.

const BASE = "https://v3.football.api-sports.io";
const TZ = "America/Argentina/Buenos_Aires"; // la API devuelve horarios ya en hora ARG

const LEAGUE = process.env.WC_LEAGUE_ID || "1"; // 1 = Copa del Mundo
const SEASON = process.env.WC_SEASON || "2026";

// Cache en memoria simple para no quemar el limite del plan free (100 req/dia).
// Clave -> { data, expira }. Los dias pasados se cachean mas tiempo que el dia actual.
const cache = new Map();

function getCached(key) {
  const hit = cache.get(key);
  if (hit && hit.expira > Date.now()) return hit.data;
  return null;
}
function setCached(key, data, ttlMs) {
  cache.set(key, { data, expira: Date.now() + ttlMs });
}

async function apiGet(path) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("Falta API_FOOTBALL_KEY en las variables de entorno");

  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-apisports-key": key },
    // Sin cache de Next: manejamos el cache nosotros segun la fecha
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API-Football respondio ${res.status}`);
  const json = await res.json();
  // La API mete los errores en el body con 200; los exponemos para debug
  if (json.errors && Object.keys(json.errors).length) {
    throw new Error("API-Football error: " + JSON.stringify(json.errors));
  }
  return json.response || [];
}

// Devuelve los partidos de una fecha (YYYY-MM-DD) ya simplificados.
export async function getMatchesByDate(date) {
  const cacheKey = `matches:${date}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const path = `/fixtures?league=${LEAGUE}&season=${SEASON}&date=${date}&timezone=${encodeURIComponent(TZ)}`;
  const raw = await apiGet(path);
  const data = raw.map(simplifyFixture).sort(byKickoff);

  // TTL: dias pasados cambian poco (6h); hoy/futuro se refresca rapido (60s) por partidos en vivo
  const ttl = date < todayISO() ? 6 * 60 * 60 * 1000 : 60 * 1000;
  setCached(cacheKey, data, ttl);
  return data;
}

// Devuelve el detalle de un partido + sus goles.
export async function getMatchDetail(fixtureId) {
  const cacheKey = `match:${fixtureId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const [fxRaw, evRaw] = await Promise.all([
    apiGet(`/fixtures?id=${fixtureId}&timezone=${encodeURIComponent(TZ)}`),
    apiGet(`/fixtures/events?fixture=${fixtureId}`),
  ]);

  const fixture = fxRaw[0] ? simplifyFixture(fxRaw[0]) : null;
  const goals = (evRaw || [])
    .filter((e) => e.type === "Goal")
    .map((e) => ({
      minute: e.time?.elapsed ?? null,
      extra: e.time?.extra ?? null,
      team: e.team?.name || "",
      player: e.player?.name || "Desconocido",
      assist: e.assist?.name || null,
      detail: e.detail || "Normal Goal", // Penalty / Own Goal / etc.
    }))
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  const data = { fixture, goals };
  // Si el partido ya termino, el detalle no cambia: cache largo. Si no, 60s.
  const ttl = fixture && fixture.finished ? 24 * 60 * 60 * 1000 : 60 * 1000;
  setCached(cacheKey, data, ttl);
  return data;
}

// --- helpers ---

function simplifyFixture(f) {
  const status = f.fixture?.status?.short || "NS";
  const liveCodes = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"];
  return {
    id: f.fixture?.id,
    kickoff: f.fixture?.date, // ISO ya en hora ARG (offset incluido)
    statusShort: status,
    statusLong: f.fixture?.status?.long || "",
    elapsed: f.fixture?.status?.elapsed ?? null,
    live: liveCodes.includes(status),
    finished: ["FT", "AET", "PEN"].includes(status),
    round: f.league?.round || "",
    home: {
      name: f.teams?.home?.name || "",
      logo: f.teams?.home?.logo || "",
      goals: f.goals?.home,
      winner: f.teams?.home?.winner === true,
    },
    away: {
      name: f.teams?.away?.name || "",
      logo: f.teams?.away?.logo || "",
      goals: f.goals?.away,
      winner: f.teams?.away?.winner === true,
    },
  };
}

function byKickoff(a, b) {
  return new Date(a.kickoff) - new Date(b.kickoff);
}

function todayISO() {
  // Fecha de "hoy" en hora Argentina (para decidir el TTL)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
