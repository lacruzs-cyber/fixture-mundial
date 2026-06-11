// Cliente del lado servidor para football-data.org (API publica con registro
// gratuito). Requiere un token gratis: https://www.football-data.org/client/register

import { getFlagUrl } from "./teamMeta";
import { getMatchChannels } from "./tvSchedule";

const BASE = "https://api.football-data.org/v4";
const COMPETITION = process.env.FOOTBALL_DATA_COMPETITION || "WC"; // WC = FIFA World Cup

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

async function apiGet(path) {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) throw new Error("Falta FOOTBALL_DATA_TOKEN en las variables de entorno");

  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": token },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`football-data.org respondio ${res.status}`);
  return res.json();
}

// Devuelve todos los partidos del Mundial, ordenados por fecha/hora.
// El proximo partido por jugarse (o el que esta en vivo) queda primero;
// despues siguen los futuros en orden, y al final los ya jugados
// (del mas reciente al mas viejo).
export async function getAllMatches() {
  const cacheKey = "all-matches";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const raw = await apiGet(`/competitions/${COMPETITION}/matches`);
  const all = (raw.matches || []).map(simplifyMatch).sort(byKickoff);

  const upcoming = all.filter((m) => !m.finished);
  const past = all.filter((m) => m.finished).reverse();
  const data = [...upcoming, ...past];

  // Cache corto: si hay un partido en vivo necesitamos refrescar seguido
  // para que el resultado y los goles se actualicen.
  const ttl = data.some((m) => m.live) ? 20 * 1000 : 60 * 1000;
  setCached(cacheKey, data, ttl);
  return data;
}

// Devuelve el detalle de un partido + sus goles.
export async function getMatchDetail(id) {
  const cacheKey = `match:${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const raw = await apiGet(`/matches/${id}`);
  const fixture = simplifyMatch(raw);
  const goals = (raw.goals || [])
    .map((g) => ({
      minute: g.minute ?? null,
      extra: null,
      team: g.team?.name || "",
      player: g.scorer?.name || "Desconocido",
      assist: g.assist?.name || null,
      detail: g.type === "PENALTY" ? "Penalty" : g.type === "OWN" ? "Own Goal" : "Normal Goal",
    }))
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  const data = { fixture, goals };
  // Si el partido ya termino, el detalle no cambia: cache largo. Si no, 60s.
  const ttl = fixture.finished ? 24 * 60 * 60 * 1000 : 60 * 1000;
  setCached(cacheKey, data, ttl);
  return data;
}

// --- helpers ---

const STAGE_LABELS = {
  GROUP_STAGE: "Fase de grupos",
  LAST_32: "Dieciseisavos de final",
  LAST_16: "Octavos de final",
  QUARTER_FINALS: "Cuartos de final",
  SEMI_FINALS: "Semifinal",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
};

function roundLabel(m) {
  const stage = STAGE_LABELS[m.stage] || m.stage || "";
  return m.group ? `${stage} · ${m.group}`.trim() : stage;
}

function statusInfo(m) {
  const s = m.status;
  const live = s === "IN_PLAY" || s === "PAUSED";
  const finished = s === "FINISHED" || s === "AWARDED";

  let long;
  switch (s) {
    case "SCHEDULED":
    case "TIMED":
      long = "Programado";
      break;
    case "IN_PLAY":
      long = "En vivo";
      break;
    case "PAUSED":
      long = "Entretiempo";
      break;
    case "FINISHED":
      long = "Finalizado";
      break;
    case "POSTPONED":
      long = "Postergado";
      break;
    case "SUSPENDED":
      long = "Suspendido";
      break;
    case "CANCELLED":
      long = "Cancelado";
      break;
    default:
      long = s || "";
  }

  return { live, finished, long };
}

function scoreFor(m, side) {
  const ft = m.score?.fullTime?.[side];
  if (ft !== null && ft !== undefined) return ft;
  const ht = m.score?.halfTime?.[side];
  if (ht !== null && ht !== undefined) return ht;
  return null;
}

function simplifyMatch(m) {
  const status = statusInfo(m);
  const homeName = m.homeTeam?.name || m.homeTeam?.shortName || "";
  const awayName = m.awayTeam?.name || m.awayTeam?.shortName || "";

  return {
    id: m.id,
    kickoff: m.utcDate,
    statusShort: m.status,
    statusLong: status.long,
    elapsed: m.minute ?? null,
    live: status.live,
    finished: status.finished,
    round: roundLabel(m),
    channels: getMatchChannels(homeName, awayName, m.utcDate),
    home: {
      name: homeName,
      logo: m.homeTeam?.crest || "",
      flag: getFlagUrl(homeName) || m.homeTeam?.crest || "",
      goals: scoreFor(m, "home"),
      winner: status.finished && m.score?.winner === "HOME_TEAM",
    },
    away: {
      name: awayName,
      logo: m.awayTeam?.crest || "",
      flag: getFlagUrl(awayName) || m.awayTeam?.crest || "",
      goals: scoreFor(m, "away"),
      winner: status.finished && m.score?.winner === "AWAY_TEAM",
    },
  };
}

function byKickoff(a, b) {
  return new Date(a.kickoff) - new Date(b.kickoff);
}
