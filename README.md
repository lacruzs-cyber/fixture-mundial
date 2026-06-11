# Fixture Mundial 2026 ⚽

Sitio web (mobile-first) que muestra todos los partidos del Mundial FIFA 2026 en una sola lista, con scroll infinito (carga de a 10), banderas de los equipos, **horarios y canales de TV en Argentina**, resultados de partidos jugados y **goleadores** al tocar un partido. El próximo partido por jugarse aparece primero. Los partidos de **Argentina** aparecen destacados.

Stack: **Next.js 14** (App Router) + datos de **football-data.org**, una API pública con registro gratuito. Sin base de datos: las rutas `/api` pegan en vivo a la API con un cache en memoria.

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `FOOTBALL_DATA_TOKEN` | Token gratuito de [football-data.org](https://www.football-data.org/client/register) (registro sin costo, te llega por mail) | **requerida** |
| `FOOTBALL_DATA_COMPETITION` | Código de la competencia (Mundial FIFA = `WC`) | `WC` |

Local: copiá `.env.example` a `.env.local` y poné tu token.

> Nota: el detalle de **goleadores** depende de los datos que football-data.org tenga cargados para cada partido; si no hay información disponible se muestra "Sin goles" o "Todavía no hay goles".
>
> Los **canales de TV** mostrados (Telefe, TV Pública, DirecTV Sports) son una referencia basada en los acuerdos habituales de transmisión del Mundial en Argentina, no provienen de una API (no existe una pública con esa info).

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
3. En el servicio → **Variables** → agregá `FOOTBALL_DATA_TOKEN` con tu token.
4. Railway detecta Next.js solo (Nixpacks): corre `npm install`, `npm run build` y `npm start`.
   El script `start` se bindea al `PORT` que asigna Railway.
5. En **Settings → Networking** → Generate Domain para tener la URL pública.

## Estructura

```
app/
  page.js                 lista infinita de partidos (banderas, hora, canales)
  partido/[id]/page.js    detalle del partido + goleadores
  api/matches/route.js    proxy: todos los partidos del Mundial
  api/match/[id]/route.js proxy: detalle + goles
  globals.css             estilos (modo oscuro)
lib/footballData.js       cliente football-data.org + cache + hora ARG
lib/teamMeta.js            banderas (flagcdn.com) + canales de TV
```

## Notas

- football-data.org tiene un límite de 10 requests/minuto en el plan free; el cache en memoria (60s) evita pasarse.
- Los horarios de la API vienen en UTC; el front los muestra en `America/Argentina/Buenos_Aires`.
- `next@14.2.35` (versión parcheada por seguridad).
