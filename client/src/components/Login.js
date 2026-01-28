// src/components/Login.js
import { useState } from "react";
import { login, saveToken } from "../api";

export default function Login({ onLoggedIn, onSwitchToSignup }) {
  // ✅ מתחילים ריק כדי שלא יהיה כיתוב בתוך השדות
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login({ email, password });
      saveToken(data.token);
      onLoggedIn(data.user);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={{ marginTop: 0 }}>Login</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={styles.label}>
          Email
          <input
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </label>

        <label style={styles.label}>
          Password
          <input
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </label>

        {error ? <div style={styles.error}>{error}</div> : null}

        <button style={styles.button} disabled={loading} type="submit">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: 14 }}>
        No account?{" "}
        <button type="button" onClick={onSwitchToSignup} style={styles.linkBtn}>
          Signup
        </button>
      </p>
    </div>
  );
}

const styles = {
  card: {
    width: 360,
    padding: 20,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    background: "white",
  },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    outline: "none",
  },
  button: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "#111827",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
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
