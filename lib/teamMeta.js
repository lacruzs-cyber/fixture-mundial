// Banderas (flagcdn.com, CDN publico y gratuito) y datos de TV para Argentina.

const COUNTRY_CODES = {
  argentina: "ar",
  brazil: "br",
  brasil: "br",
  uruguay: "uy",
  colombia: "co",
  ecuador: "ec",
  paraguay: "py",
  chile: "cl",
  peru: "pe",
  bolivia: "bo",
  venezuela: "ve",
  mexico: "mx",
  "méxico": "mx",
  "usa": "us",
  "united states": "us",
  canada: "ca",
  "costa rica": "cr",
  panama: "pa",
  honduras: "hn",
  jamaica: "jm",
  "el salvador": "sv",
  haiti: "ht",
  curacao: "cw",
  "curaçao": "cw",
  "trinidad and tobago": "tt",
  guatemala: "gt",
  france: "fr",
  germany: "de",
  spain: "es",
  "españa": "es",
  england: "gb-eng",
  scotland: "gb-sct",
  wales: "gb-wls",
  "northern ireland": "gb-nir",
  portugal: "pt",
  netherlands: "nl",
  holland: "nl",
  belgium: "be",
  italy: "it",
  croatia: "hr",
  switzerland: "ch",
  poland: "pl",
  denmark: "dk",
  sweden: "se",
  norway: "no",
  austria: "at",
  "czech republic": "cz",
  czechia: "cz",
  slovakia: "sk",
  slovenia: "si",
  hungary: "hu",
  romania: "ro",
  serbia: "rs",
  ukraine: "ua",
  greece: "gr",
  turkey: "tr",
  "türkiye": "tr",
  "republic of ireland": "ie",
  ireland: "ie",
  finland: "fi",
  iceland: "is",
  albania: "al",
  "bosnia and herzegovina": "ba",
  "north macedonia": "mk",
  georgia: "ge",
  kosovo: "xk",
  morocco: "ma",
  senegal: "sn",
  ghana: "gh",
  cameroon: "cm",
  tunisia: "tn",
  algeria: "dz",
  nigeria: "ng",
  egypt: "eg",
  "south africa": "za",
  "ivory coast": "ci",
  "côte d'ivoire": "ci",
  "cote d'ivoire": "ci",
  "cape verde": "cv",
  "dr congo": "cd",
  mali: "ml",
  zambia: "zm",
  japan: "jp",
  "south korea": "kr",
  "korea republic": "kr",
  "korea dpr": "kp",
  "saudi arabia": "sa",
  iran: "ir",
  "ir iran": "ir",
  qatar: "qa",
  australia: "au",
  "new zealand": "nz",
  "united arab emirates": "ae",
  uae: "ae",
  iraq: "iq",
  jordan: "jo",
  uzbekistan: "uz",
  china: "cn",
  india: "in",
  vietnam: "vn",
  thailand: "th",
  indonesia: "id",
};

function normalize(name) {
  return (name || "").trim().toLowerCase();
}

// URL del escudo/bandera del pais (CDN flagcdn.com, publico y gratuito).
export function getFlagUrl(teamName) {
  const code = COUNTRY_CODES[normalize(teamName)];
  if (!code) return null;
  return `https://flagcdn.com/w80/${code}.png`;
}

export function isArgentina(name) {
  return normalize(name) === "argentina";
}

// Canales de TV en Argentina. No hay una API publica con esta info,
// se basa en los acuerdos habituales de transmision del Mundial.
export function getTvChannels(homeName, awayName) {
  if (isArgentina(homeName) || isArgentina(awayName)) {
    return ["TV Pública", "Telefe", "DirecTV Sports"];
  }
  return ["Telefe", "DirecTV Sports"];
}
