// src/components/Dashboard.js
import { useMemo, useState } from "react";
import CoinPrices from "./CoinPrices";
import AIInsight from "./AIInsight";
import MarketNews from "./MarketNews.js";
import FunMeme from "./FunMeme";
import { voteSection } from "../api";

export default function Dashboard({
  user,
  preferences,
  onLogout,
  onEditPreferences,
}) {
  const sections = useMemo(() => {
    const chosen = new Set(preferences?.content || []);
    const items = [];

    if (chosen.has("Market News")) {
      items.push({
        key: "news",
        title: "Market News",
        desc: "Daily crypto headlines tailored to you.",
      });
    }

    if (chosen.has("Coin Prices")) {
      items.push({
        key: "prices",
        title: "Coin Prices",
        desc: "Track your selected coins at a glance.",
      });
    }

    // חשוב שזה יתאים בדיוק לשם ב-Onboarding
    if (chosen.has("AI Insights")) {
      items.push({
        key: "ai",
        title: "AI Insight of the Day",
        desc: "A short AI-generated insight based on your interests.",
      });
    }

    if (chosen.has("Fun / Memes")) {
      items.push({
        key: "meme",
        title: "Fun Crypto Meme",
        desc: "A fresh meme every refresh 😄",
      });
    }

    if (!items.length) {
      return [
        { key: "news", title: "Market News", desc: "Daily crypto headlines." },
        { key: "prices", title: "Coin Prices", desc: "Track coins at a glance." },
        { key: "ai", title: "AI Insight of the Day", desc: "A short AI-generated insight." },
        { key: "meme", title: "Fun Crypto Meme", desc: "A fresh meme 😄" },
      ];
    }

    return items;
  }, [preferences]);

  // sectionKey -> "up" | "down" | undefined
  const [votes, setVotes] = useState({});
  // sectionKey -> boolean (בקשה רצה)
  const [voteBusy, setVoteBusy] = useState({});
  // sectionKey -> string
  const [voteError, setVoteError] = useState({});

  async function vote(sectionKey, dir) {
    if (voteBusy[sectionKey]) return;

    const current = votes[sectionKey]; // "up" | "down" | undefined
    const next = current === dir ? "none" : dir; // toggle / switch

    // optimistic UI
    setVotes((prev) => {
      const copy = { ...prev };
      if (next === "none") delete copy[sectionKey];
      else copy[sectionKey] = next;
      return copy;
    });

    setVoteError((prev) => ({ ...prev, [sectionKey]: "" }));
    setVoteBusy((prev) => ({ ...prev, [sectionKey]: true }));

    try {
      await voteSection(sectionKey, next); // next = "up" | "down" | "none"
    } catch (e) {
      // rollback
      setVotes((prev) => {
        const copy = { ...prev };
        if (!current) delete copy[sectionKey];
        else copy[sectionKey] = current;
        return copy;
      });

      setVoteError((prev) => ({
        ...prev,
        [sectionKey]: e?.message || "Failed to save vote",
      }));
    } finally {
      setVoteBusy((prev) => ({ ...prev, [sectionKey]: false }));
    }
  }

  function renderSectionContent(key) {
    if (key === "news") return <MarketNews />;
    if (key === "prices") return <CoinPrices assets={preferences?.assets || ["BTC"]} />;
    if (key === "ai") return <AIInsight />;
    if (key === "meme") return <FunMeme />;

    return (
      <div style={styles.placeholder}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Placeholder</div>
        <div style={{ color: "#6b7280" }}>
          Next step: fetch real data from API and show it here.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <h1 style={{ margin: 0 }}>Crypto Advisor</h1>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
            Welcome back, <b>{user?.name}</b> - {user?.email}
          </div>
        </div>

        {/* כפתורים בצד ימין */}
        <div style={styles.topbarActions}>
          <button
            style={styles.secondaryBtn}
            onClick={onEditPreferences}
            type="button"
            title="Edit your onboarding choices"
          >
            Edit preferences
          </button>

          <button style={styles.logout} onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </div>

      <div style={styles.metaRow}>
        <div style={styles.pill}>
          <b>Assets:</b> {preferences?.assets?.join(", ") || "-"}
        </div>
        <div style={styles.pill}>
          <b>Investor:</b> {preferences?.investorType || "-"}
        </div>
      </div>

      <div style={styles.grid}>
        {sections.map((s) => {
          const isBusy = Boolean(voteBusy[s.key]);
          const err = voteError[s.key];

          return (
            <div key={s.key} style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>{s.title}</h2>

                <div style={styles.voteRow}>
                  <button
                    style={{
                      ...styles.voteBtn,
                      ...(votes[s.key] === "up" ? styles.voteActive : {}),
                      ...(isBusy ? styles.voteDisabled : {}),
                    }}
                    onClick={() => vote(s.key, "up")}
                    title={votes[s.key] === "up" ? "Undo thumbs up" : "Thumbs up"}
                    type="button"
                    disabled={isBusy}
                  >
                    👍
                  </button>

                  <button
                    style={{
                      ...styles.voteBtn,
                      ...(votes[s.key] === "down" ? styles.voteActive : {}),
                      ...(isBusy ? styles.voteDisabled : {}),
                    }}
                    onClick={() => vote(s.key, "down")}
                    title={votes[s.key] === "down" ? "Undo thumbs down" : "Thumbs down"}
                    type="button"
                    disabled={isBusy}
                  >
                    👎
                  </button>
                </div>
              </div>

              <p style={styles.desc}>{s.desc}</p>

              {renderSectionContent(s.key)}

              {isBusy ? (
                <div style={styles.voteStatus}>Saving vote...</div>
              ) : err ? (
                <div style={{ ...styles.voteStatus, ...styles.voteStatusError }}>{err}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 20,
    display: "grid",
    gap: 16,
    alignContent: "start",
  },
  topbar: {
    maxWidth: 1100,
    margin: "0 auto",
    width: "100%",
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 14px 40px rgba(0,0,0,0.06)",
  },
  topbarActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    color: "#111827",
    fontWeight: 700,
    cursor: "pointer",
  },
  logout: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "none",
    background: "#111827",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  metaRow: {
    maxWidth: 1100,
    margin: "0 auto",
    width: "100%",
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  pill: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "10px 12px",
    fontSize: 14,
  },
  grid: {
    maxWidth: 1100,
    margin: "0 auto",
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },
  card: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 14px 40px rgba(0,0,0,0.06)",
    display: "grid",
    gap: 10,
    alignContent: "start",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: { margin: 0, fontSize: 18 },
  desc: { margin: 0, color: "#6b7280" },
  placeholder: {
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    borderRadius: 14,
    padding: 12,
  },
  voteRow: { display: "flex", gap: 8 },
  voteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    fontSize: 18,
  },
  voteActive: {
    border: "1px solid #111827",
    boxShadow: "0 10px 20px rgba(17,24,39,0.12)",
  },
  voteDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  voteStatus: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b7280",
  },
  voteStatusError: {
    color: "#991b1b",
    fontWeight: 700,
  },
};
