// MissingBlueprintsReport.jsx — Renders report layout for PDF/JPEG export. Dark theme, ARC style.
import { getDropForBlueprint } from "../../shared/data/blueprint_drops";

export default function MissingBlueprintsReport({ missingBlueprints, userName, totalCount }) {
  const displayName = userName || "Raider";

  return (
    <div
      ref={null}
      style={{
        width: 600,
        minHeight: 400,
        padding: 32,
        background: "#0d0d0d",
        color: "#e8e8e8",
        fontFamily: "'Yanone Kaffeesatz', sans-serif",
        borderRadius: 8,
        border: "1px solid #333",
      }}
    >
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["#ED391B", "#5a9cf5", "#2d9d8a"].map((c, i) => (
          <div key={i} style={{ width: 24, height: 3, background: c, borderRadius: 2 }} />
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.2em", color: "#ED391B", textTransform: "uppercase", marginBottom: 6 }}>
        Speranza Intel
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, color: "#fff" }}>
        Missing Blueprints
      </h1>
      <p style={{ fontSize: 17, color: "#a0a0a0", marginBottom: 24, lineHeight: 1.5 }}>
        Report for {displayName} · {missingBlueprints.length} of {totalCount} still needed
      </p>

      {missingBlueprints.length === 0 ? (
        <div style={{ fontSize: 18, color: "#2d9d8a", padding: "24px 0", lineHeight: 1.5 }}>
          You&apos;ve collected every blueprint currently in the database.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {missingBlueprints.map((bp, i) => {
            const drop = getDropForBlueprint(bp.name);
            const whereText = drop
              ? `${drop.map} · ${drop.condition} · ${drop.containers}`
              : "Location TBD";
            return (
              <div
                key={bp.id}
                style={{
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
                    {i + 1}. {bp.name || bp.id}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      color: "#5a9cf5",
                      textTransform: "uppercase",
                    }}
                  >
                    {bp.category}
                  </span>
                </div>
                <div style={{ fontSize: 15, color: "#a0a0a0", lineHeight: 1.45 }}>
                  Where: {whereText}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 24, fontSize: 12, color: "#666", textAlign: "center", lineHeight: 1.5 }}>
        ARC Raider Syndicate · Generated from blueprint tracker
      </div>
    </div>
  );
}
