
import { useEffect, useMemo, useState } from "react";

export default function MarketNews() {
  const [items, setItems] = useState([]);
  const [source, setSource] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Normalize/validate URLs so external links always open reliably

  function safeUrl(maybeUrl) {
    try {
      const u = new URL(maybeUrl);
      if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
      return "https://cryptopanic.com/";
    } catch {
      return "https://cryptopanic.com/";
    }
  }

  // Fetch top market news items (protected). Sends JWT manually for this endpoint.

  async function load() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("moveo_token");
      if (!token) throw new Error("Missing token. Please login again.");

      const res = await fetch("/api/news", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
      }

      const list = Array.isArray(data.items) ? data.items : [];

      
      const normalized = list.map((n) => ({
        ...n,
        url: safeUrl(n?.url),
      }));

      setItems(normalized);
      setSource(data.source || "CryptoPanic");
      setUpdatedAt(data.updatedAt || new Date().toISOString());
    } catch (e) {
      setError(e?.message || "Failed to load news");
      setItems([]);
      setSource("");
      setUpdatedAt("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limit to 4 items for a compact dashboard layout

  const topItems = useMemo(() => items.slice(0, 4), [items]);

  if (loading) {
    return (
      <div style={styles.wrap}>
        <Header onRefresh={() => {}} refreshing />
        <SkeletonList />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.wrap}>
        <Header onRefresh={load} refreshing={false} />
        <div style={{ ...styles.note, ...styles.error }}>{error}</div>
      </div>
    );
  }

  if (!topItems.length) {
    return (
      <div style={styles.wrap}>
        <Header onRefresh={load} refreshing={false} />
        <div style={styles.note}>No news found. Try refresh.</div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <Header onRefresh={load} refreshing={false} />

      <div style={styles.list}>
        {topItems.map((n, i) => {
          const src = n?.source || "Unknown source";
          const dateTxt = n?.publishedAt ? timeAgoOrDate(n.publishedAt) : "";

          
          const key = `${n?.url || "u"}-${n?.publishedAt || "t"}-${i}`;

          return (
            <a
              key={key}
              href={n.url} 
              target="_blank"
              rel="noreferrer"
              style={styles.item}
              title={n?.title || ""}
            >
              <div style={styles.itemTop}>
                <div style={styles.badge}>{src}</div>
                {dateTxt ? <div style={styles.time}>{dateTxt}</div> : null}
              </div>

              <div style={styles.title}>{n.title}</div>

              <div style={styles.openHint}>Open ↗</div>
            </a>
          );
        })}
      </div>

      <div style={styles.footer}>
        Source: <b>{source}</b>
        {updatedAt ? (
          <span>
            {" "}
            · Updated:{" "}
            <span style={{ fontWeight: 700 }}>{new Date(updatedAt).toLocaleString()}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Small UI pieces ---------- */

function Header({ onRefresh, refreshing }) {
  return (
    <div style={styles.headerRow}>
      <button
        type="button"
        onClick={onRefresh}
        style={{
          ...styles.refresh,
          ...(refreshing ? styles.refreshDisabled : {}),
        }}
        disabled={refreshing}
        title="Refresh"
      >
        ↻
      </button>
    </div>
  );
}

function SkeletonList() {
  return (
    <div style={styles.list}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={styles.skelItem}>
          <div style={styles.skelTop}>
            <div style={styles.skelBadge} />
            <div style={styles.skelTime} />
          </div>
          <div style={styles.skelLine1} />
          <div style={styles.skelLine2} />
        </div>
      ))}
    </div>
  );
}

// Human-friendly timestamp formatting (minutes/hours ago, otherwise date)

function timeAgoOrDate(iso) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  if (!Number.isFinite(diffMs)) return "";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return d.toLocaleDateString();
}

/* ---------- Styles ---------- */

const styles = {
  wrap: { display: "grid", gap: 12 },

  headerRow: {
  display: "flex",
  justifyContent: "flex-end",
  padding: 0,                 
  border: "none",             
  background: "transparent",  
  },


  refresh: {
    width: 32,
    height: 32,
    border: "1px solid #e5e7eb",
    background: "white",
    borderRadius: 999,
    padding: 0,
    cursor: "pointer",
    fontWeight: 900,
    lineHeight: 1,
    fontSize: 14,
    display: "grid",
    placeItems: "center",
  },
  refreshDisabled: { opacity: 0.6, cursor: "not-allowed" },

  list: { display: "grid", gap: 10 },

  item: {
    textDecoration: "none",
    color: "#111827",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fafafa",
    display: "grid",
    gap: 8,
    transition: "transform 120ms ease",
  },

  itemTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  badge: {
    fontSize: 12,
    fontWeight: 800,
    padding: "4px 10px",
    borderRadius: 999,
    background: "white",
    border: "1px solid #e5e7eb",
    color: "#111827",
    maxWidth: "75%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  time: { fontSize: 12, color: "#6b7280", fontWeight: 700 },

  title: {
    fontWeight: 900,
    lineHeight: 1.3,
    fontSize: 14,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },

  openHint: { fontSize: 12, color: "#6b7280", fontWeight: 700 },

  footer: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  note: {
    padding: 10,
    borderRadius: 12,
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    fontSize: 13,
  },
  error: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 800,
  },

  /* Skeleton */
  skelItem: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fafafa",
    display: "grid",
    gap: 10,
  },
  skelTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  skelBadge: {
    height: 18,
    width: "55%",
    borderRadius: 999,
    background: "#e5e7eb",
  },
  skelTime: {
    height: 12,
    width: 60,
    borderRadius: 6,
    background: "#e5e7eb",
  },
  skelLine1: {
    height: 12,
    width: "95%",
    borderRadius: 6,
    background: "#e5e7eb",
  },
  skelLine2: {
    height: 12,
    width: "70%",
    borderRadius: 6,
    background: "#e5e7eb",
  },
};
