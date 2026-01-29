

// Token storage key for JWT (used for authenticated API calls)
const TOKEN_KEY = "moveo_token";

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Centralized API helper: JSON handling + error normalization + optional Bearer auth header
async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || data?.raw || "Request failed");
  }

  return data;
}

/* ===== Auth ===== */

export function register({ name, email, password }) {
  return request("/api/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
}

export function login({ email, password }) {
  return request("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function me() {
  return request("/api/me", { auth: true });
}

/* ===== Preferences ===== */

export function savePreferences(preferences) {
  return request("/api/preferences", {
    method: "POST",
    body: preferences,
    auth: true,
  });
}

export function getPreferences() {
  return request("/api/preferences", { auth: true });
}

/* ===== AI Insight ===== */

export function getAiInsight() {
  return request("/api/ai-insight", { auth: true });
}

/* ===== Votes ===== */
// Voting API wrapper (protected): vote = "up" | "down" | "none"

export function voteSection(section, vote) {
  // vote = "up" | "down"
  return request("/api/vote", {
    method: "POST",
    auth: true,
    body: { section, vote },
  });
}
