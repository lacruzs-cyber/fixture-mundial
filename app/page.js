"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

const TZ = "America/Argentina/Buenos_Aires";
const PAGE_SIZE = 10;

// Fecha del partido en hora ARG, usada para agrupar por dia (YYYY-MM-DD).
function dayKey(iso) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

// "jueves 11 de junio"
function dayLabel(iso) {
  const txt = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  }).format(new Date(iso));
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

// "16:00"
function timeLabel(iso) {
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
  const [matches, setMatches] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load(showSpinner) {
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/matches");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error al cargar");
        if (!cancelled) setMatches(json.matches || []);
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setMatches([]);
        }
      } finally {
        if (showSpinner && !cancelled) setLoading(false);
      }
    }

    load(true);
    // Refresca en segundo plano para que resultados/goles en vivo se actualicen.
    const interval = setInterval(() => load(false), 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const hasMore = visibleCount < matches.length;

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + PAGE_SIZE, matches.length));
  }, [matches.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const visible = matches.slice(0, visibleCount);

  return (
    <div className="container">
      <header className="header">
        <h1>⚽ Mundial 2026</h1>
        <div className="sub">Horarios y canales en hora Argentina</div>
      </header>

      {loading && <div className="spinner">Cargando partidos…</div>}
      {error && <div className="empty">⚠️ {error}</div>}
      {!loading && !error && visible.length === 0 && (
        <div className="empty">No hay partidos para mostrar.</div>
      )}

      {!loading && !error && visible.map((m, i) => {
        const key = m.kickoff ? dayKey(m.kickoff) : null;
        const prevKey = i > 0 && visible[i - 1].kickoff ? dayKey(visible[i - 1].kickoff) : null;
        const showSeparator = key && key !== prevKey;
        return (
          <div key={m.id}>
            {showSeparator && <div className="day-sep">{dayLabel(m.kickoff)}</div>}
            <MatchCard m={m} />
          </div>
        );
      })}

      {hasMore && (
        <div ref={sentinelRef} className="spinner">Cargando más…</div>
      )}
    </div>
  );
}

function MatchCard({ m }) {
  const arg = isArgentina(m.home.name) || isArgentina(m.away.name);
  const showScore = m.live || m.finished;

  return (
    <Link href={`/partido/${m.id}`} className={`match${arg ? " arg" : ""}`}>
      <div className="match-top">
        <span className="match-date">{m.kickoff ? timeLabel(m.kickoff) : ""}</span>
        {m.live ? (
          <span className="badge live">EN VIVO {m.elapsed ? `${m.elapsed}'` : ""}</span>
        ) : m.finished ? (
          <span className="badge done">Finalizado</span>
        ) : (
          <span className="badge sched">{m.round || "Mundial"}</span>
        )}
      </div>

      <div className="teams-row">
        <TeamCol t={m.home} align="right" />
        <div className="score-col">
          {showScore ? `${m.home.goals ?? 0} - ${m.away.goals ?? 0}` : "vs"}
        </div>
        <TeamCol t={m.away} align="left" />
      </div>

      <div className="match-bottom">
        {m.round && <span className="round">{m.round}</span>}
        {m.channels?.length > 0 && (
          <span className="channels">📺 {m.channels.join(" · ")}</span>
        )}
      </div>
    </Link>
  );
}

function TeamCol({ t, align }) {
  const flag = t.flag || t.logo;
  return (
    <div className={`team-col${t.winner ? " winner" : ""}`} style={{ textAlign: align }}>
      {flag ? <img src={flag} alt="" /> : <span className="flag-placeholder" />}
      <span className="name">{t.name}</span>
    </div>
  );
}
