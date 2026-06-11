"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

const TZ = "America/Argentina/Buenos_Aires";
const PAGE_SIZE = 10;

// "jue. 11 jun, 16:00"
function dateTimeLabel(iso) {
  const txt = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
  return txt.replace(",", "");
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
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/matches");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error al cargar");
        setMatches(json.matches || []);
      } catch (e) {
        setError(e.message);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    })();
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

      {!loading && !error && visible.map((m) => <MatchCard key={m.id} m={m} />)}

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
        <span className="match-date">{m.kickoff ? dateTimeLabel(m.kickoff) : ""}</span>
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
