# Fixture Mundial 2026 ⚽

Sitio web (mobile-first) que muestra los partidos del Mundial FIFA 2026 en **hora Argentina**, con navegación día por día, resultados de partidos jugados y **goleadores** al tocar un partido. Los partidos de **Argentina** aparecen destacados.

Stack: **Next.js 14** (App Router) + datos de **API-Football** (api-sports.io). Sin base de datos: las rutas `/api` pegan en vivo a la API con un cache en memoria para no quemar el límite del plan free.

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `API_FOOTBALL_KEY` | Tu key de api-football.com (dashboard → My Access) | **requerida** |
| `WC_LEAGUE_ID` | ID de la liga (Copa del Mundo = 1) | `1` |
| `WC_SEASON` | Temporada | `2026` |

Local: copiá `.env.example` a `.env.local` y poné tu key.

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
3. En el servicio → **Variables** → agregá `API_FOOTBALL_KEY` con tu key.
4. Railway detecta Next.js solo (Nixpacks): corre `npm install`, `npm run build` y `npm start`.
   El script `start` se bindea al `PORT` que asigna Railway.
5. En **Settings → Networking** → Generate Domain para tener la URL pública.

## Estructura

```
app/
  page.js                 vista del día + navegación + lista
  partido/[id]/page.js    detalle del partido + goleadores
  api/matches/route.js    proxy: partidos por fecha (oculta la key)
  api/match/[id]/route.js proxy: detalle + eventos/goles
  globals.css             estilos (modo oscuro)
lib/apiFootball.js        cliente API-Football + cache + hora ARG
```

## Notas

- Plan free de API-Football = **100 requests/día**. El cache reduce el consumo (días pasados 6 h, día actual 60 s).
- La API devuelve los horarios ya convertidos a `America/Argentina/Buenos_Aires`.
- `next@14.2.35` (versión parcheada por seguridad).
