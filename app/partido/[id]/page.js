"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const TZ = "America/Argentina/Buenos_Aires";

function kickoffFull(iso) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

// Traduce el tipo de gol que devuelve la API
function goalLabel(detail) {
  switch (detail) {
    case "Penalty": return "Penal";
    case "Own Goal": return "En contra";
    default: return null;
  }
}

export default function MatchDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/match/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error al cargar");
        setData(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="container">
      <Link href="/" className="back">‹ Volver</Link>

      {loading && <div className="spinner">Cargando…</div>}
      {error && <div className="empty">⚠️ {error}</div>}

      {data && data.fixture && (
        <>
          <div className="detail-head">
            <div className="vs-row">
              <div className="side">
                {(data.fixture.home.flag || data.fixture.home.logo) && (
                  <img src={data.fixture.home.flag || data.fixture.home.logo} alt="" />
                )}
                <div className="name">{data.fixture.home.name}</div>
              </div>
              <div className="result">
                {data.fixture.live || data.fixture.finished
                  ? `${data.fixture.home.goals ?? 0} - ${data.fixture.away.goals ?? 0}`
                  : "vs"}
              </div>
              <div className="side">
                {(data.fixture.away.flag || data.fixture.away.logo) && (
                  <img src={data.fixture.away.flag || data.fixture.away.logo} alt="" />
                )}
                <div className="name">{data.fixture.away.name}</div>
              </div>
            </div>
            <div className="meta">
              {data.fixture.round} · {kickoffFull(data.fixture.kickoff)}
              <br />
              {data.fixture.live
                ? `EN VIVO ${data.fixture.elapsed ? data.fixture.elapsed + "'" : ""}`
                : data.fixture.statusLong}
              {data.fixture.channels?.length > 0 && (
                <>
                  <br />
                  📺 {data.fixture.channels.join(" · ")}
                </>
              )}
            </div>
          </div>

          <div className="section-title">Goles</div>
          {data.goals.length === 0 ? (
            <div className="empty">
              {data.fixture.finished ? "Sin goles." : "Todavía no hay goles."}
            </div>
          ) : (
            data.goals.map((g, i) => {
              const tag = goalLabel(g.detail);
              return (
                <div className="goal" key={i}>
                  <span className="min">
                    {g.minute}'{g.extra ? `+${g.extra}` : ""}
                  </span>
                  <div className="who">
                    <div className="player">
                      ⚽ {g.player} {tag && <span className="extra">({tag})</span>}
                    </div>
                    {g.assist && <div className="extra">asist. {g.assist}</div>}
                    <div className="team-tag">{g.team}</div>
                  </div>
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
