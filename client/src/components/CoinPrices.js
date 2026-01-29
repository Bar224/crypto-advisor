
import { useEffect, useMemo, useState } from "react";

export default function CoinPrices({ assets = ["BTC"] }) {
  const [rows, setRows] = useState([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  
  const [refreshKey, setRefreshKey] = useState(0);

  // Normalize selected assets into a stable query string for API requests

  const query = useMemo(() => {
    const cleaned = (assets || [])
      .map((a) => String(a).trim().toUpperCase())
      .filter(Boolean);
    return cleaned.join(",");
  }, [assets]);

  useEffect(() => {
    let cancelled = false;

    // Fetch coin prices for selected assets; supports manual refresh without full page reload

    async function load() {
      if (!query) {
        setRows([]);
        setUpdatedAt("");
        return;
      }

      setError("");
      setLoading(true);

      try {
        const res = await fetch(`/api/prices?assets=${encodeURIComponent(query)}`);

       
        let data = {};
        try {
          data = await res.json();
        } catch {
          data = {};
        }

        if (!res.ok) {
          throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
        }

        if (cancelled) return;

        setRows(Array.isArray(data.prices) ? data.prices : []);
        setUpdatedAt(data.updatedAt || "");
      } catch (e) {
        if (cancelled) return;

        setError(e?.message || "Failed to load prices");
        setRows([]);
        setUpdatedAt("");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query, refreshKey]);

  return (
    <div style={styles.wrap}>
      <div style={styles.topRow}>
          <button
           type="button"
           onClick={() => setRefreshKey((k) => k + 1)}
            style={styles.refresh}
            title="Refresh"
            disabled={loading}
            >
      ↻
  </button>
</div>

      {!query ? (
        <div style={styles.note}>Pick at least one asset in onboarding.</div>
      ) : null}

      {loading ? <div style={styles.note}>Loading prices...</div> : null}
      {error ? <div style={{ ...styles.note, ...styles.error }}>{error}</div> : null}

      {!loading && !error && query ? (
        rows.length ? (
          <div style={styles.table}>
            {rows.map((r) => (
              <div key={r.symbol} style={styles.row}>
                <div style={styles.symbol}>{r.symbol}</div>

                <div style={{fontWight: 800, fontSize: 16}}>
                  ${Number(r.usd).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>

                <ChangeBadge value={Number(r.usd_24h_change)} />
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.note}>No prices found.</div>
        )
      ) : null}

      {updatedAt ? (
        <div style={styles.updatedAt}>
          Updated: {new Date(updatedAt).toLocaleString()}
        </div>
      ) : null}
    </div>
  );
}

// Visual indicator for 24h percentage change (up/down)

function ChangeBadge({ value }) {
  const safe = Number.isFinite(value) ? value : 0;
  const isUp = safe >= 0;

  return (
    <div
      style={{
        ...styles.badge,
        ...(isUp ? styles.badgeUp : styles.badgeDown),
      }}
      title="24h change %"
    >
      {isUp ? "▲" : "▼"} {Math.abs(safe).toFixed(2)}%
    </div>
  );
}
const styles = {
  wrap: {
    display: "grid",
    gap: 14,
    maxWidth: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  topRow: {
  display: "flex",
  justifyContent: "flex-end", 
  alignItems: "center",
  gap: 8,
  padding: 0,
  margin: 0,
  border: "none",
  background: "transparent",
  },


  title: {
    fontWeight: 900,
    fontSize: 18,
    letterSpacing: -0.2,
    margin: 0,
  },

  sub: {
    marginTop: 4,
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 700,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  refresh: {
    width: 32,
    height: 32,
    minWidth: 32,
    minHeight: 32,
    borderRadius: 999,
    border: "1px solid rgba(229,231,235,0.9)",
    background: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontWeight: 900,
    lineHeight: 1,
    fontSize: 14,
    display: "grid",
    placeItems: "center",
    boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
    boxSizing: "border-box",
  },

  table: {
    display: "grid",
    gap: 12,
    maxWidth: "100%",
    boxSizing: "border-box",
  },

  row: {
  display: "grid",
  gridTemplateColumns: "48px minmax(0, 1fr) max-content", 
  alignItems: "center",
  gap: 4, 

  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(229,231,235,0.9)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
  backdropFilter: "blur(6px)",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  },



  symbol: {
    fontWeight: 900,
    letterSpacing: -0.1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  price: {
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  badge: {
  minWidth: 0,
  padding: "6px 6px", 
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12,
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.9)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  whiteSpace: "nowrap",
  },

  badgeUp: {
    background: "rgba(236,253,245,0.95)",
    color: "#065f46",
    border: "1px solid #a7f3d0",
  },

  badgeDown: {
    background: "rgba(254,242,242,0.95)",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },

  note: {
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.9)",
    border: "1px dashed #d1d5db",
    color: "#111827",
    fontSize: 13,
    fontWeight: 700,
    boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
    backdropFilter: "blur(6px)",

    maxWidth: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  error: {
    background: "rgba(254,242,242,0.9)",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 900,
  },

  updatedAt: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 800,
    maxWidth: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
