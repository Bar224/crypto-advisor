// client/src/components/Signup.js
import { useState } from "react";
import { saveToken } from "../api";

export default function Signup({ onSignedUp, onSwitchToLogin }) {
  // ✅ מתחילים ריק כדי שלא יהיה כיתוב בתוך השדות
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function safeJson(res) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { raw: text };
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (loading) return;

    setError("");

    const n = String(name || "").trim();
    const em = String(email || "").trim();
    const pw = String(password || "").trim();

    if (!n || !em || !pw) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      // 1) Register
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, email: em, password: pw }),
      });

      const rData = await safeJson(r);
      if (!r.ok) {
        setError(rData?.error || rData?.message || "Signup failed");
        return;
      }

      // 2) Auto-login אחרי הרשמה
      const l = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password: pw }),
      });

      const lData = await safeJson(l);
      if (!l.ok) {
        setError(lData?.error || lData?.message || "Login after signup failed");
        return;
      }

      if (!lData?.token) {
        setError("Login succeeded but token is missing");
        return;
      }

      saveToken(lData.token);
      onSignedUp?.(lData.user);
    } catch (err) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.shell}>
      <div style={styles.card}>
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Create account</h2>
        <p style={styles.sub}>Create an account and personalize your dashboard.</p>

        {error ? <div style={styles.error}>{error}</div> : null}

        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <label style={styles.label}>
            Name
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoComplete="name"
              placeholder="Your name"
              required
            />
          </label>

          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              required
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />
          </label>

          <button style={styles.button} disabled={loading} type="submit">
            {loading ? "Creating..." : "Signup"}
          </button>
        </form>

        <div style={styles.footerRow}>
          <span style={{ color: "#6b7280" }}>Already have an account?</span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={styles.linkBtn}
            disabled={loading}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  shell: {
    width: "100%",
    display: "grid",
    placeItems: "center",
    padding: 8,
  },

  card: {
    width: 360, // זהה ללוגאין
    padding: 20,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    background: "white",
  },

  sub: {
    marginTop: 0,
    marginBottom: 14,
    color: "#6b7280",
    fontSize: 14,
  },

  label: {
    display: "grid",
    gap: 6,
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
  },

  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: 14,
    background: "white",
  },

  button: {
    marginTop: 2,
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "#111827",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },

  footerRow: {
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  linkBtn: {
    background: "transparent",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    padding: 0,
    fontWeight: 600,
  },

  error: {
    padding: 10,
    borderRadius: 10,
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: 14,
  },
};
