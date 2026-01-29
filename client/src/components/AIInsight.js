import { useEffect, useState } from "react";
import { getAiInsight } from "../api";

export default function AIInsight() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch fresh AI insight (protected endpoint). Includes retry and loading skeleton UX.

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await getAiInsight();
      setData(res);
    } catch (e) {
      setError("Failed to load AI insight");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <Skeleton />;
  }

  if (error) {
    return (
      <div style={styles.error}>
        {error}
        <button onClick={load} style={styles.retry}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <button onClick={load} style={styles.refresh} title="Refresh insight">
          ↻
        </button>
      </div>

      <p style={{lineHeight: 1.6 , frontSize: 14 }}> {data.insight}</p>

      <div style={styles.time}>
        Updated: {new Date(data.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      <div style={styles.skelLine} />
      <div style={styles.skelLine} />
      <div style={styles.skelLineShort} />
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "flex-end", 
    alignItems: "center",
    marginBottom: 8,
    padding: 0,
    border: "none",
    background: "transparent",
  },

  
  model: {
    display: "none",
    fontSize: 12,
    color: "#6b7280",
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
    padding: 0,
    boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
  },

  text: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#111827",
    fontWeight: 700,

    display: "-webkit-box",
    WebkitLineClamp: 5,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },

  time: {
    marginTop: 10,
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 800,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  error: {
    color: "#991b1b",
    display: "grid",
    gap: 10,
    fontWeight: 900,
  },

  retry: {
    border: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.9)",
    color: "#111827",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
  },

  skelLine: {
    height: 12,
    background: "#e5e7eb",
    borderRadius: 6,
    marginBottom: 8,
  },

  skelLineShort: {
    height: 12,
    width: "60%",
    background: "#e5e7eb",
    borderRadius: 6,
  },
};
