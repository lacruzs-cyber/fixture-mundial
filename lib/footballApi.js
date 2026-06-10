// Cliente del lado servidor para TheSportsDB (api publica y gratuita, sin key).
// https://www.thesportsdb.com/api.php -- key "3" es la key de pruebas/uso libre.

const BASE = "https://www.thesportsdb.com/api/v1/json/3";
const TZ = "America/Argentina/Buenos_Aires";

// Copa del Mundo FIFA en TheSportsDB
const LEAGUE_ID = process.env.WC_LEAGUE_ID || "4429";
const LEAGUE_NAME = "FIFA World Cup";

// Cache en memoria simple para no abusar de la API publica.
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
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`TheSportsDB respondio ${res.status}`);
  return res.json();
}

// Devuelve los partidos de una fecha (YYYY-MM-DD) ya simplificados.
export async function getMatchesByDate(date) {
  const cacheKey = `matches:${date}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const json = await apiGet(`/eventsday.php?d=${date}&l=${encodeURIComponent(LEAGUE_NAME)}`);
  const events = (json.events || []).filter(
    (e) => e.idLeague === LEAGUE_ID || e.strLeague === LEAGUE_NAME
  );
  const data = events.map(simplifyEvent).sort(byKickoff);

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

  const fxJson = await apiGet(`/lookupevent.php?id=${fixtureId}`);
  const ev = (fxJson.events || [])[0];
  const fixture = ev ? simplifyEvent(ev) : null;

  // El timeline de goles es un endpoint premium en TheSportsDB: si no esta
  // disponible para la key publica, mostramos la lista vacia sin romper la pagina.
  let goals = [];
  try {
    const tlJson = await apiGet(`/lookuptimeline.php?id=${fixtureId}`);
    goals = (tlJson.timeline || [])
      .filter((t) => (t.strTimeline || "").toLowerCase().includes("goal"))
      .map((t) => ({
        minute: t.intTime != null ? parseInt(t.intTime, 10) : null,
        extra: null,
        team: t.strHome === "Yes" ? fixture?.home.name || "" : fixture?.away.name || "",
        player: t.strPlayer || "Desconocido",
        assist: t.strAssist || null,
        detail: t.strTimelineDetail || "Normal Goal",
      }))
      .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
  } catch {
    goals = [];
  }

  const data = { fixture, goals };
  // Si el partido ya termino, el detalle no cambia: cache largo. Si no, 60s.
  const ttl = fixture && fixture.finished ? 24 * 60 * 60 * 1000 : 60 * 1000;
  setCached(cacheKey, data, ttl);
  return data;
}

// --- helpers ---

const FINISHED_STATUSES = ["Match Finished", "FT", "AET", "Penalties", "After Extra Time", "After Penalties"];
const NOT_STARTED_STATUSES = ["", "NS", "Not Started", "TBD"];

function simplifyEvent(e) {
  const status = e.strStatus || "";
  const finished = FINISHED_STATUSES.includes(status);
  const live = !finished && !NOT_STARTED_STATUSES.includes(status);

  const homeGoals = e.intHomeScore != null ? Number(e.intHomeScore) : null;
  const awayGoals = e.intAwayScore != null ? Number(e.intAwayScore) : null;
  const hasScore = homeGoals != null && awayGoals != null;

  return {
    id: e.idEvent,
    kickoff: toISO(e.strTimestamp, e.dateEvent, e.strTime),
    statusShort: status,
    statusLong: status,
    elapsed: live && e.strProgress ? Number(e.strProgress) : null,
    live,
    finished,
    round: e.intRound ? `Fecha ${e.intRound}` : "",
    home: {
      name: e.strHomeTeam || "",
      logo: e.strHomeTeamBadge || "",
      goals: homeGoals,
      winner: finished && hasScore && homeGoals > awayGoals,
    },
    away: {
      name: e.strAwayTeam || "",
      logo: e.strAwayTeamBadge || "",
      goals: awayGoals,
      winner: finished && hasScore && awayGoals > homeGoals,
    },
  };
}

// TheSportsDB devuelve los timestamps en UTC, a veces sin sufijo de zona.
function toISO(timestamp, dateEvent, time) {
  if (timestamp) {
    return /[zZ]|[+-]\d{2}:\d{2}$/.test(timestamp) ? timestamp : `${timestamp}Z`;
  }
  if (dateEvent && time) return `${dateEvent}T${time}Z`;
  if (dateEvent) return `${dateEvent}T00:00:00Z`;
  return null;
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
