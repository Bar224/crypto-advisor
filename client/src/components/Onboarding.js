// src/components/Onboarding.js
import { useMemo, useState } from "react";

const ASSETS = ["BTC", "ETH", "SOL", "DOGE", "ADA", "XRP"];
const INVESTOR_TYPES = ["HODLer", "Day Trader", "NFT Collector", "DeFi Explorer"];
const CONTENT_TYPES = ["Market News", "Coin Prices", "AI Insights", "Fun / Memes"];

export default function Onboarding({
  userName = "User",
  onFinish,
  initialPreferences = null, // { assets:[], investorType:"", content:[] }
  mode = "onboarding", // "onboarding" | "edit"
  onCancel, // במצב edit - לחזור לדאשבורד
}) {
  const [step, setStep] = useState(1);

  // ערכים התחלתיים (מצב עריכה)
  const initialAssets = Array.isArray(initialPreferences?.assets)
    ? initialPreferences.assets.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const initialInvestorType = initialPreferences?.investorType
    ? String(initialPreferences.investorType).trim()
    : "";
  const initialContent = Array.isArray(initialPreferences?.content)
    ? initialPreferences.content.map((x) => String(x).trim()).filter(Boolean)
    : [];

  const [assets, setAssets] = useState(initialAssets);
  const [investorType, setInvestorType] = useState(initialInvestorType);
  const [content, setContent] = useState(initialContent);

  const isEdit = mode === "edit";

  const canNext = useMemo(() => {
    if (step === 1) return assets.length > 0;
    if (step === 2) return Boolean(investorType);
    if (step === 3) return content.length > 0;
    return false;
  }, [step, assets, investorType, content]);

  function toggle(setter, value) {
    const v = String(value).trim();
    setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  function next() {
    if (!canNext) return;
    if (step < 3) setStep((s) => s + 1);
  }

  function back() {
    if (step > 1) setStep((s) => s - 1);
  }

  function finish() {
    if (!canNext) return;

    const preferences = {
      assets: assets.map((a) => String(a).trim()),
      investorType: String(investorType).trim(),
      content: content.map((c) => String(c).trim()),
    };

    onFinish(preferences);
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.h1}>
              {isEdit ? "Edit your preferences" : `Welcome, ${userName} 👋`}
            </h1>
            <p style={styles.sub}>
              {isEdit
                ? "Update your dashboard choices. Changes will be saved."
                : "Let’s personalize your crypto dashboard in 30 seconds."}
            </p>
          </div>

          <div style={styles.stepPill}>Step {step} of 3</div>
        </div>

        <div style={styles.card}>
          {step === 1 && (
            <>
              <h2 style={styles.title}>Which crypto assets interest you?</h2>
              <p style={styles.hint}>Pick at least one. You can change this later.</p>

              <div style={styles.gridAuto}>
                {ASSETS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggle(setAssets, a)}
                    style={{
                      ...styles.chip,
                      ...(assets.includes(a) ? styles.chipActive : {}),
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={styles.title}>What type of investor are you?</h2>
              <p style={styles.hint}>Choose one that fits you best.</p>

              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {INVESTOR_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setInvestorType(t)}
                    style={{
                      ...styles.option,
                      ...(investorType === t ? styles.optionActive : {}),
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontWeight: 900 }}>{t}</span>
                      {investorType === t ? <span style={styles.selectedTag}>Selected</span> : null}
                    </div>
                    <span style={styles.optionDesc}>{describeType(t)}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={styles.title}>What content would you like to see daily?</h2>
              <p style={styles.hint}>Pick what matters to you most.</p>

              {/* ✅ 2 למעלה 2 למטה */}
              <div style={styles.grid2}>
                {CONTENT_TYPES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(setContent, c)}
                    style={{
                      ...styles.chipWide,
                      ...(content.includes(c) ? styles.chipWideActive : {}),
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{c}</div>
                    <div style={styles.chipMini}>
                      {c === "Market News"
                        ? "Headlines"
                        : c === "Coin Prices"
                        ? "Your coins"
                        : c === "AI Insights"
                        ? "Daily insight"
                        : "Fun"}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={styles.footer}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={back}
                style={{ ...styles.btn, ...styles.btnGhost }}
                disabled={step === 1}
              >
                Back
              </button>

              {isEdit && typeof onCancel === "function" ? (
                <button
                  type="button"
                  onClick={onCancel}
                  style={{ ...styles.btn, ...styles.btnGhost }}
                >
                  Back to dashboard
                </button>
              ) : null}
            </div>

            {step < 3 ? (
              <button type="button" onClick={next} style={styles.btn} disabled={!canNext}>
                Continue
              </button>
            ) : (
              <button type="button" onClick={finish} style={styles.btn} disabled={!canNext}>
                {isEdit ? "Save" : "Finish"}
              </button>
            )}
          </div>
        </div>

        <div style={styles.preview}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Preview</div>
          <div style={styles.previewBox}>
            <div>
              <b>Assets:</b> {assets.length ? assets.join(", ") : "-"}
            </div>
            <div>
              <b>Investor:</b> {investorType || "-"}
            </div>
            <div>
              <b>Content:</b> {content.length ? content.join(", ") : "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function describeType(t) {
  if (t === "HODLer") return "Long-term holder, less noise, more conviction.";
  if (t === "Day Trader") return "Fast moves, frequent updates and signals.";
  if (t === "NFT Collector") return "Culture, trends, and community vibes.";
  if (t === "DeFi Explorer") return "Protocols, yields, and on-chain activity.";
  return "";
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
    background: "#f3f4f6",
  },
  shell: {
    width: "100%",
    maxWidth: 860,
    display: "grid",
    gap: 14,
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    padding: 2,
  },
  h1: { margin: 0, fontSize: 28, letterSpacing: -0.3 },
  sub: { margin: "6px 0 0", color: "#4b5563" },

  stepPill: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(229,231,235,0.9)",
    fontWeight: 900,
    boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
  },

  card: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    border: "1px solid rgba(229,231,235,0.9)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.10)",
    padding: 18,
    backdropFilter: "blur(8px)",
  },

  title: { margin: 0, fontSize: 18, fontWeight: 900 },
  hint: { marginTop: 6, color: "#6b7280", marginBottom: 0 },

  // Assets
  gridAuto: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 10,
    marginTop: 14,
  },

  // ✅ Content grid 2x2
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginTop: 14,
    maxWidth: 520,
  },

  chip: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  },
  chipActive: {
    border: "1px solid #111827",
    background: "#111827",
    color: "white",
    boxShadow: "0 16px 38px rgba(17,24,39,0.18)",
  },

  chipWide: {
    padding: "12px 12px",
    borderRadius: 16,
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    textAlign: "left",
    display: "grid",
    gap: 6,
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    minHeight: 64,
  },
  chipWideActive: {
    border: "1px solid #111827",
    background: "#111827",
    color: "white",
    boxShadow: "0 16px 38px rgba(17,24,39,0.18)",
  },
  chipMini: {
    fontSize: 12,
    color: "rgba(107,114,128,0.95)",
    fontWeight: 800,
  },

  option: {
    textAlign: "left",
    padding: 14,
    borderRadius: 16,
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    display: "grid",
    gap: 6,
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  },
  optionActive: {
    border: "1px solid #111827",
    boxShadow: "0 18px 45px rgba(17,24,39,0.14)",
  },
  optionDesc: { fontSize: 13, color: "#6b7280", fontWeight: 700 },
  selectedTag: {
    fontSize: 12,
    fontWeight: 900,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#111827",
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },

  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    background: "#111827",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    minWidth: 120,
    boxShadow: "0 16px 40px rgba(17,24,39,0.18)",
  },
  btnGhost: {
    background: "rgba(255,255,255,0.9)",
    border: "1px solid #d1d5db",
    color: "#111827",
    boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
  },

  preview: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    border: "1px solid rgba(229,231,235,0.9)",
    padding: 14,
    boxShadow: "0 18px 60px rgba(0,0,0,0.08)",
    backdropFilter: "blur(8px)",
    maxWidth: 520,
  },
  previewBox: {
    display: "grid",
    gap: 6,
    color: "#111827",
    fontSize: 14,
  },
};
