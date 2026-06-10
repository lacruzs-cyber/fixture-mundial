# Fixture Mundial 2026 ⚽

Sitio web (mobile-first) que muestra los partidos del Mundial FIFA 2026 en **hora Argentina**, con navegación día por día, resultados de partidos jugados y **goleadores** al tocar un partido. Los partidos de **Argentina** aparecen destacados.

Stack: **Next.js 14** (App Router) + datos de **TheSportsDB** (thesportsdb.com), una API pública y gratuita que no requiere registro. Sin base de datos: las rutas `/api` pegan en vivo a la API con un cache en memoria.

## Variables de entorno

Todas son opcionales, la app funciona "out of the box":

| Variable | Descripción | Default |
|---|---|---|
| `THESPORTSDB_API_KEY` | Key de thesportsdb.com (la "3" es la key de test pública gratuita) | `3` |
| `THESPORTSDB_LEAGUE_ID` | ID de la liga (Copa del Mundo FIFA = 4429) | `4429` |
| `THESPORTSDB_SEASON` | Temporada | `2026` |

Local: copiá `.env.example` a `.env.local` si querés personalizar algo.

> Nota: con la key gratuita de TheSportsDB, el detalle de **goleadores** depende de los datos que la API tenga cargados para cada partido; si no hay información disponible se muestra "Sin goles" o "Todavía no hay goles".

## Correr local

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build de producción

```bash
npm run build
npm start
```

## Deploy en Railway

1. Subí el repo a GitHub (ver abajo).
2. En Railway: New Project → Deploy from GitHub repo → elegí `fixture-mundial`.
3. Railway detecta Next.js solo (Nixpacks): corre `npm install`, `npm run build` y `npm start`.
   El script `start` se bindea al `PORT` que asigna Railway.
4. En **Settings → Networking** → Generate Domain para tener la URL pública.

## Estructura

```
app/
  page.js                 vista del día + navegación + lista
  partido/[id]/page.js    detalle del partido + goleadores
  api/matches/route.js    proxy: partidos por fecha
  api/match/[id]/route.js proxy: detalle + goles
  globals.css             estilos (modo oscuro)
lib/theSportsDb.js         cliente TheSportsDB + cache + hora ARG
```

## Notas

- TheSportsDB es gratuita y pública; el cache en memoria reduce las consultas (días pasados 6 h, día actual 60 s) y los escudos de equipos se cachean para siempre.
- Los horarios de la API vienen en UTC; el front los muestra en `America/Argentina/Buenos_Aires`.
- `next@14.2.35` (versión parcheada por seguridad).
