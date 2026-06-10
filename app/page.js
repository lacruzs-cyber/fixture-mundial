"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const TZ = "America/Argentina/Buenos_Aires";

// Fecha de hoy en hora Argentina como YYYY-MM-DD
function todayARG() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Suma dias a un YYYY-MM-DD sin que se corra por zona horaria
function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

// Etiqueta linda: "jueves 11 de junio"
function dateLabel(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(dt);
}

// Hora del partido (HH:mm) a partir del ISO que ya viene en hora ARG
function kickoffTime(iso) {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

function isArgentina(name) {
  return (name || "").toLowerCase() === "argentina";
}

export default function Home() {
  const [date, setDate] = useState(todayARG());
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (d) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches?date=${d}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al cargar");
      setMatches(json.matches || []);
    } catch (e) {
      setError(e.message);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  const today = todayARG();

  return (
    <div className="container">
      <header className="header">
        <h1>⚽ Mundial 2026</h1>
        <div className="sub">Horarios en hora Argentina</div>
      </header>

      <nav className="daynav">
        <button onClick={() => setDate(addDays(date, -1))} aria-label="Dia anterior">‹</button>
        <div className="date">
          {dateLabel(date)}
          {date !== today && (
            <div>
              <button className="today-btn" onClick={() => setDate(today)}>Ir a hoy</button>
            </div>
          )}
        </div>
        <button onClick={() => setDate(addDays(date, 1))} aria-label="Dia siguiente">›</button>
      </nav>

      {loading && <div className="spinner">Cargando partidos…</div>}
      {error && <div className="empty">⚠️ {error}</div>}
      {!loading && !error && matches.length === 0 && (
        <div className="empty">No hay partidos este día.</div>
      )}

      {!loading && !error && matches.map((m) => (
        <MatchCard key={m.id} m={m} />
      ))}
    </div>
  );
}

function MatchCard({ m }) {
  const arg = isArgentina(m.home.name) || isArgentina(m.away.name);
  const showScore = m.live || m.finished;

  return (
    <Link href={`/partido/${m.id}`} className={`match${arg ? " arg" : ""}`}>
      <div className="match-top">
        <span>{m.round || "Mundial"}</span>
        {m.live ? (
          <span className="badge live">EN VIVO {m.elapsed ? `${m.elapsed}'` : ""}</span>
        ) : m.finished ? (
          <span className="badge done">Finalizado</span>
        ) : (
          <span className="badge sched">{kickoffTime(m.kickoff)}</span>
        )}
      </div>

      <div className="teams">
        <TeamRow t={m.home} showScore={showScore} />
        <TeamRow t={m.away} showScore={showScore} />
      </div>
    </Link>
  );
}

function TeamRow({ t, showScore }) {
  return (
    <div className={`team${t.winner ? " winner" : ""}`}>
      {t.logo ? <img src={t.logo} alt="" /> : <span style={{ width: 26 }} />}
      <span className="name">{t.name}</span>
      {showScore && <span className="score">{t.goals ?? 0}</span>}
    </div>
  );
}
