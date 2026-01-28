// src/App.js
import { useEffect, useState } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import { clearToken, getToken, me, getPreferences, savePreferences } from "./api";

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("login"); // login | signup
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [preferences, setPreferences] = useState(null);
  const [prefsLoading, setPrefsLoading] = useState(false);

  const [editPrefs, setEditPrefs] = useState(false);

  useEffect(() => {
    async function init() {
      setError("");
      setLoading(true);

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const meRes = await me();
        setUser(meRes.user);

        setPrefsLoading(true);
        try {
          const prefRes = await getPreferences();
          setPreferences(prefRes?.preferences || null);
        } catch {
          setPreferences(null);
        } finally {
          setPrefsLoading(false);
        }
      } catch {
        clearToken();
        setUser(null);
        setPreferences(null);
        setEditPrefs(false);
        setError("Session expired, please login again");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  function logout() {
    clearToken();
    setUser(null);
    setPreferences(null);
    setEditPrefs(false);
    setScreen("login");
  }

  async function handleFinishOnboarding(prefs) {
    setError("");
    setPrefsLoading(true);
    try {
      await savePreferences(prefs);
      setPreferences(prefs);
      setEditPrefs(false);
    } catch (e) {
      setError(e.message || "Failed to save preferences");
    } finally {
      setPrefsLoading(false);
    }
  }

  if (loading) return <div style={pageStyles.base}>Loading...</div>;

  const shouldShowOnboarding =
    Boolean(user) && (prefsLoading ? false : editPrefs || !preferences);

  // ✅ רק אם לא מחוברים – רקע של התמונה
  const isAuthScreen = !user;

  return (
    <div style={isAuthScreen ? pageStyles.authPage : pageStyles.base}>
      {/* ✅ שכבת כהות עדינה כדי שהכרטיס יהיה קריא */}
      {isAuthScreen ? <div style={pageStyles.overlay} /> : null}

      <div style={pageStyles.container}>
        {error ? <div style={pageStyles.banner}>{error}</div> : null}

        {user ? (
          prefsLoading ? (
            <div style={pageStyles.card}>
              <h2 style={{ marginTop: 0 }}>Loading preferences...</h2>
              <p>Just a second 🙂</p>
            </div>
          ) : shouldShowOnboarding ? (
            <Onboarding
              userName={user.name}
              onFinish={handleFinishOnboarding}
              mode={editPrefs ? "edit" : "onboarding"}
              initialPreferences={editPrefs ? preferences : null}
              onCancel={editPrefs ? () => setEditPrefs(false) : null}
            />
          ) : (
            <Dashboard
              user={user}
              preferences={preferences}
              onLogout={logout}
              onEditPreferences={() => setEditPrefs(true)}
            />
          )
        ) : (
          <>
            {/* אפשר להשאיר את הכותרת או להעביר לתוך Login/Signup */}
            <h1 style={{ marginTop: 0, color: isAuthScreen ? "white" : "#111827", zIndex: 1 }}>
              
            </h1>

            {screen === "login" ? (
              <Login
                onLoggedIn={(u) => {
                  setUser(u);
                  window.location.reload();
                }}
                onSwitchToSignup={() => setScreen("signup")}
              />
            ) : (
              <Signup
                onSignedUp={(u) => {
                  setUser(u);
                  window.location.reload();
                }}
                onSwitchToLogin={() => setScreen("login")}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

const pageStyles = {
  base: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f3f4f6",
    padding: 20,
  },

  // ✅ רקע תמונה למסכי login/signup
  authPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
    backgroundImage: "url(/login-bg.png)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    position: "relative",
  },

  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
  },

  container: {
    width: "100%",
    maxWidth: 900,
    display: "grid",
    gap: 16,
    justifyItems: "center",
    position: "relative",
    zIndex: 1,
  },

  banner: {
    width: 420,
    padding: 12,
    borderRadius: 12,
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
  },

  card: {
    width: 420,
    padding: 20,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    background: "white",
  },
};
