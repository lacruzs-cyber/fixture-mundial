// Cliente del lado servidor para TheSportsDB (thesportsdb.com), API publica.
// Usa la key de test "3", gratuita y sin necesidad de registro.

const API_KEY = process.env.THESPORTSDB_API_KEY || "3";
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;
const TZ = "America/Argentina/Buenos_Aires";

const LEAGUE_ID = process.env.THESPORTSDB_LEAGUE_ID || "4429"; // 4429 = FIFA World Cup
const SEASON = process.env.THESPORTSDB_SEASON || "2026";

// Cache en memoria simple. Clave -> { data, expira }.
const cache = new Map();
function getCached(key) {
  const hit = cache.get(key);
  if (hit && hit.expira > Date.now()) return hit.data;
  return null;
}
function setCached(key, data, ttlMs) {
  cache.set(key, { data, expira: Date.now() + ttlMs });
}

// Los escudos de los equipos no cambian: se cachean para siempre.
const teamBadgeCache = new Map();

async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`TheSportsDB respondio ${res.status}`);
  return res.json();
}

async function getTeamBadge(teamId) {
  if (!teamId) return "";
  if (teamBadgeCache.has(teamId)) return teamBadgeCache.get(teamId);
  try {
    const json = await apiGet(`/lookupteam.php?id=${teamId}`);
    const badge = json.teams?.[0]?.strTeamBadge || "";
    teamBadgeCache.set(teamId, badge);
    return badge;
  } catch {
    teamBadgeCache.set(teamId, "");
    return "";
  }
}

// Trae el calendario completo de la temporada (eventsday.php filtra por fecha
// en UTC, lo que corre de dia los partidos nocturnos en hora ARG).
async function getSeasonEvents() {
  const cacheKey = "season-events";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const raw = await apiGet(`/eventsseason.php?id=${LEAGUE_ID}&s=${SEASON}`);
  const events = raw.events || [];
  setCached(cacheKey, events, 30 * 60 * 1000);
  return events;
}

// Devuelve los partidos de una fecha (YYYY-MM-DD, hora ARG) ya simplificados.
export async function getMatchesByDate(date) {
  const cacheKey = `matches:${date}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const events = await getSeasonEvents();
  const ofDate = events.filter((ev) => argDateOf(ev) === date);
  const data = (await Promise.all(ofDate.map(simplifyEvent))).sort(byKickoff);

  // TTL: dias pasados cambian poco (6h); hoy/futuro se refresca rapido (60s) por partidos en vivo
  const ttl = date < todayISO() ? 6 * 60 * 60 * 1000 : 60 * 1000;
  setCached(cacheKey, data, ttl);
  return data;
}

// Fecha del partido (YYYY-MM-DD) en hora Argentina, a partir de su kickoff UTC.
function argDateOf(ev) {
  const iso = kickoffISO(ev);
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

// Devuelve el detalle de un partido + sus goles.
export async function getMatchDetail(eventId) {
  const cacheKey = `match:${eventId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const raw = await apiGet(`/lookupevent.php?id=${eventId}`);
  const ev = (raw.events || [])[0];
  if (!ev) {
    const empty = { fixture: null, goals: [] };
    setCached(cacheKey, empty, 60 * 1000);
    return empty;
  }

  const fixture = await simplifyEvent(ev);
  const goals = [
    ...parseGoalDetails(ev.strHomeGoalDetails, fixture.home.name),
    ...parseGoalDetails(ev.strAwayGoalDetails, fixture.away.name),
  ].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  const data = { fixture, goals };
  // Si el partido ya termino, el detalle no cambia: cache largo. Si no, 60s.
  const ttl = fixture.finished ? 24 * 60 * 60 * 1000 : 60 * 1000;
  setCached(cacheKey, data, ttl);
  return data;
}

// --- helpers ---

const FINISHED_STATUS = new Set(["FT", "AET", "PEN", "Match Finished", "Finished"]);
const LIVE_STATUS = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "In Progress"]);

function statusInfo(ev, homeGoals, awayGoals) {
  const raw = (ev.strStatus || "").trim();
  const hasScore = homeGoals !== null && awayGoals !== null;

  let finished = FINISHED_STATUS.has(raw);
  let live = LIVE_STATUS.has(raw);
  if (!finished && !live && hasScore && raw !== "NS" && raw !== "Not Started") {
    finished = true;
  }

  return {
    short: raw || (finished ? "FT" : "NS"),
    long: finished ? "Finalizado" : live ? "En vivo" : "Programado",
    elapsed: ev.strProgress ? parseInt(ev.strProgress, 10) : null,
    live,
    finished,
  };
}

async function simplifyEvent(ev) {
  const homeGoals = toIntOrNull(ev.intHomeScore);
  const awayGoals = toIntOrNull(ev.intAwayScore);
  const status = statusInfo(ev, homeGoals, awayGoals);

  const [homeLogo, awayLogo] = await Promise.all([
    getTeamBadge(ev.idHomeTeam),
    getTeamBadge(ev.idAwayTeam),
  ]);

  return {
    id: ev.idEvent,
    kickoff: kickoffISO(ev),
    statusShort: status.short,
    statusLong: status.long,
    elapsed: status.elapsed,
    live: status.live,
    finished: status.finished,
    round: ev.strGroup || (ev.intRound ? `Fecha ${ev.intRound}` : ""),
    home: {
      name: ev.strHomeTeam || "",
      logo: homeLogo,
      goals: homeGoals,
      winner: status.finished && homeGoals !== null && awayGoals !== null && homeGoals > awayGoals,
    },
    away: {
      name: ev.strAwayTeam || "",
      logo: awayLogo,
      goals: awayGoals,
      winner: status.finished && homeGoals !== null && awayGoals !== null && awayGoals > homeGoals,
    },
  };
}

// "Lionel Messi 23';Julian Alvarez 67'(P)" -> [{minute:23,...}, {minute:67, detail:"Penalty",...}]
function parseGoalDetails(str, teamName) {
  if (!str) return [];
  return str
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const m = entry.match(/^(.*?)\s+(\d+)'(?:\+(\d+))?\s*(\(P\)|\(OG\))?$/i);
      if (!m) {
        return { minute: null, extra: null, team: teamName, player: entry, assist: null, detail: "Normal Goal" };
      }
      const [, player, minute, extra, tag] = m;
      let detail = "Normal Goal";
      if (tag && /P/i.test(tag)) detail = "Penalty";
      else if (tag && /OG/i.test(tag)) detail = "Own Goal";
      return {
        minute: parseInt(minute, 10),
        extra: extra ? parseInt(extra, 10) : null,
        team: teamName,
        player: player.trim(),
        assist: null,
        detail,
      };
    });
}

function kickoffISO(ev) {
  if (ev.strTimestamp) return ev.strTimestamp.replace(" ", "T") + "Z";
  if (ev.dateEvent) return `${ev.dateEvent}T${ev.strTime || "00:00:00"}Z`;
  return null;
}

function toIntOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

function byKickoff(a, b) {
  return new Date(a.kickoff) - new Date(b.kickoff);
}

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
