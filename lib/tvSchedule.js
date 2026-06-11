// Grilla de TV del Mundial 2026 para Argentina.
// Fuente (puede cambiar/actualizarse): el usuario provee la info, no hay
// una API publica con esto. Ultima actualizacion basada en una tabla con
// fase de grupos completa + rangos de fechas para la fase eliminatoria.
export const TV_SCHEDULE_SOURCE_URL =
  "https://www.ellitoral.com/deportes/horarios-tv-canales-seleccion-argentina-mundial-futbol-2026-estados-unidos-mexico-canada-flow-dsports_0_QOqpJDLjct.html";

import { countryCode } from "./teamMeta";

const TZ = "America/Argentina/Buenos_Aires";

const TELEFE = "Telefe";
const TVP = "TV Pública";
const TYC = "TyC Sports";
const DSPORTS = "DSports";

const ARG_FULL = [TELEFE, TVP, TYC, DSPORTS];

// [fecha (YYYY-MM-DD, hora ARG), local, visitante, canales]
const GROUP_STAGE = [
  ["2026-06-11", "México", "Sudáfrica", ARG_FULL],
  ["2026-06-11", "Canadá", "Bosnia", [TELEFE, TYC, DSPORTS]],
  ["2026-06-12", "EE.UU.", "Paraguay", [TYC, DSPORTS]],
  ["2026-06-12", "Corea del Sur", "Rep. Checa", [DSPORTS]],
  ["2026-06-13", "Australia", "Turquía", [DSPORTS]],
  ["2026-06-13", "Qatar", "Suiza", [TYC, DSPORTS]],
  ["2026-06-13", "Brasil", "Marruecos", [TYC, DSPORTS]],
  ["2026-06-13", "Haití", "Escocia", [DSPORTS]],
  ["2026-06-14", "Alemania", "Curazao", [DSPORTS]],
  ["2026-06-14", "Países Bajos", "Japón", [TYC, DSPORTS]],
  ["2026-06-14", "Costa de Marfil", "Ecuador", [DSPORTS]],
  ["2026-06-14", "Suecia", "Túnez", [TYC, DSPORTS]],
  ["2026-06-15", "España", "Cabo Verde", [DSPORTS]],
  ["2026-06-15", "Bélgica", "Egipto", [TYC, DSPORTS]],
  ["2026-06-15", "Uruguay", "R.D. Congo", [TYC, DSPORTS]],
  ["2026-06-15", "Colombia", "Vietnam", [DSPORTS]],
  ["2026-06-16", "Francia", "Nueva Zelanda", [TYC, DSPORTS]],
  ["2026-06-16", "Inglaterra", "Jamaica", [DSPORTS]],
  ["2026-06-16", "Panamá", "Nigeria", [DSPORTS]],
  ["2026-06-16", "Argentina", "Argelia", ARG_FULL],
  ["2026-06-17", "México", "Rep. Checa", [TYC, DSPORTS]],
  ["2026-06-17", "Corea del Sur", "Sudáfrica", [DSPORTS]],
  ["2026-06-17", "Canadá", "Paraguay", [TYC, DSPORTS]],
  ["2026-06-18", "EE.UU.", "Bosnia", [DSPORTS]],
  ["2026-06-18", "Australia", "Suiza", [TYC, DSPORTS]],
  ["2026-06-18", "Qatar", "Turquía", [DSPORTS]],
  ["2026-06-19", "Brasil", "Escocia", [TYC, DSPORTS]],
  ["2026-06-19", "Haití", "Marruecos", [DSPORTS]],
  ["2026-06-19", "Alemania", "Japón", [TYC, DSPORTS]],
  ["2026-06-20", "Países Bajos", "Curazao", [DSPORTS]],
  ["2026-06-20", "Costa de Marfil", "Túnez", [TYC, DSPORTS]],
  ["2026-06-20", "Suecia", "Ecuador", [DSPORTS]],
  ["2026-06-21", "España", "Egipto", [TYC, DSPORTS]],
  ["2026-06-21", "Bélgica", "Cabo Verde", [DSPORTS]],
  ["2026-06-21", "Uruguay", "Vietnam", [TYC, DSPORTS]],
  ["2026-06-22", "Argentina", "Austria", ARG_FULL],
  ["2026-06-22", "Colombia", "R.D. Congo", [DSPORTS]],
  ["2026-06-22", "Francia", "Jamaica", [TYC, DSPORTS]],
  ["2026-06-23", "Inglaterra", "Nueva Zelanda", [DSPORTS]],
  ["2026-06-23", "México", "Corea del Sur", [TYC, DSPORTS]],
  ["2026-06-23", "Sudáfrica", "Rep. Checa", [DSPORTS]],
  ["2026-06-24", "Canadá", "EE.UU.", [TYC, DSPORTS]],
  ["2026-06-24", "Paraguay", "Bosnia", [DSPORTS]],
  ["2026-06-25", "Australia", "Qatar", [TYC, DSPORTS]],
  ["2026-06-25", "Suiza", "Turquía", [DSPORTS]],
  ["2026-06-26", "Brasil", "Haití", [TYC, DSPORTS]],
  ["2026-06-26", "Marruecos", "Escocia", [DSPORTS]],
  ["2026-06-27", "Argelia", "Austria", [DSPORTS]],
  ["2026-06-27", "Jordania", "Argentina", ARG_FULL],
];

// Fase eliminatoria: no se conocen los cruces de antemano, se asigna por
// rango de fechas.
const KNOCKOUT_RANGES = [
  { from: "2026-06-28", to: "2026-07-03", channels: [DSPORTS, TYC] }, // dieciseisavos (DSports todos, TyC 1 por dia)
  { from: "2026-07-04", to: "2026-07-07", channels: [DSPORTS, TYC] }, // octavos
  { from: "2026-07-09", to: "2026-07-11", channels: [DSPORTS, TYC] }, // cuartos
  { from: "2026-07-14", to: "2026-07-15", channels: ARG_FULL }, // semifinales
  { from: "2026-07-18", to: "2026-07-18", channels: [TYC, DSPORTS] }, // tercer puesto
  { from: "2026-07-19", to: "2026-07-19", channels: ARG_FULL }, // final
];

const GROUP_STAGE_INDEX = new Map();
for (const [date, home, away, channels] of GROUP_STAGE) {
  const pair = teamPairKey(home, away);
  if (pair) GROUP_STAGE_INDEX.set(`${date}|${pair}`, channels);
}

function teamPairKey(home, away) {
  const a = countryCode(home);
  const b = countryCode(away);
  if (!a || !b) return null;
  return [a, b].sort().join("-");
}

function argDate(iso) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

// Devuelve los canales de TV (Argentina) para un partido dado.
export function getMatchChannels(homeName, awayName, kickoffISO) {
  const date = kickoffISO ? argDate(kickoffISO) : null;

  if (date) {
    const pair = teamPairKey(homeName, awayName);
    if (pair) {
      const found = GROUP_STAGE_INDEX.get(`${date}|${pair}`);
      if (found) return found;
    }

    for (const range of KNOCKOUT_RANGES) {
      if (date >= range.from && date <= range.to) return range.channels;
    }
  }

  // Default: si juega Argentina, transmision completa; si no, al menos DSports.
  if (countryCode(homeName) === "ar" || countryCode(awayName) === "ar") return ARG_FULL;
  return [DSPORTS];
}
