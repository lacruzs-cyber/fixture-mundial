# Fixture Mundial 2026 ⚽

Sitio web (mobile-first) que muestra los partidos del Mundial FIFA 2026 en **hora Argentina**, con navegación día por día, resultados de partidos jugados y **goleadores** al tocar un partido. Los partidos de **Argentina** aparecen destacados.

Stack: **Next.js 14** (App Router) + datos de **TheSportsDB** (API pública y gratuita, sin key). Sin base de datos: las rutas `/api` pegan en vivo a la API con un cache en memoria.

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `WC_LEAGUE_ID` | ID de la liga en TheSportsDB (Copa del Mundo FIFA = 4429) | `4429` |

Local: copiá `.env.example` a `.env.local` (opcional, ya funciona con los defaults).

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
3. No hace falta configurar variables (TheSportsDB es pública).
4. Railway detecta Next.js solo (Nixpacks): corre `npm install`, `npm run build` y `npm start`.
   El script `start` se bindea al `PORT` que asigna Railway.
5. En **Settings → Networking** → Generate Domain para tener la URL pública.

## Estructura

```
app/
  page.js                 vista del día + navegación + lista
  partido/[id]/page.js    detalle del partido + goleadores
  api/matches/route.js    proxy: partidos por fecha
  api/match/[id]/route.js proxy: detalle + eventos/goles
  globals.css             estilos (modo oscuro)
lib/footballApi.js        cliente TheSportsDB + cache + hora ARG
```

## Notas

- TheSportsDB es gratuita y no requiere key (se usa la key pública `3`). El cache en memoria reduce las llamadas (días pasados 6 h, día actual 60 s).
- El timeline de goles (`lookuptimeline.php`) es un endpoint que puede no estar disponible para la key pública; si falla, el detalle del partido se muestra igual sin goleadores.
- Los horarios vienen en UTC desde la API y se convierten a `America/Argentina/Buenos_Aires` en el frontend.
- `next@14.2.35` (versión parcheada por seguridad).
