

// Load environment variables for secrets/keys (JWT, external APIs)
require("dotenv").config();
console.log("JWT_SECRET loaded?", !!process.env.JWT_SECRET);
console.log("CRYPTOPANIC_KEY loaded?", !!process.env.CRYPTOPANIC_KEY);
console.log("HF_TOKEN loaded?", !!process.env.HF_TOKEN);

// Imports
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");
const path = require("path");

// Node fetch compatibility (Node 18+ has global fetch)
const fetchFn = typeof fetch !== "undefined" ? fetch : require("node-fetch");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

/* =========================
   Health
========================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

/* =========================
   JWT Middleware
   // JWT auth middleware: validates Bearer token and attaches user payload to req.user
========================= */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing Authorization header" });

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid Authorization format" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* =========================
   Auth - Register
   // Register: create a new user with bcrypt-hashed password (email must be unique)
========================= */
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
      .run(name, email, hashedPassword);

    return res.json({ message: "User registered successfully" });
  } catch {
    return res.status(400).json({ error: "Email already exists" });
  }
});

/* =========================
   Auth - Login (JWT)
   // Login: verify credentials and issue a JWT token (7 days) for protected endpoints
========================= */
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "JWT_SECRET is missing in .env" });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

/* =========================
   Me
   // Me: returns basic user profile for the currently authenticated user
========================= */
app.get("/api/me", auth, (req, res) => {
  const user = db
    .prepare("SELECT id, name, email FROM users WHERE id = ?")
    .get(req.user.userId);

  res.json({ user });
});

/* =========================
   Preferences - Save (UPSERT)
========================= */
app.post("/api/preferences", auth, (req, res) => {
  const userId = req.user.userId;
  const { assets, investorType, content } = req.body || {};

  if (!Array.isArray(assets) || assets.length === 0) {
    return res.status(400).json({ error: "assets must be a non-empty array" });
  }
  if (!investorType) {
    return res.status(400).json({ error: "investorType is required" });
  }
  if (!Array.isArray(content) || content.length === 0) {
    return res.status(400).json({ error: "content must be a non-empty array" });
  }

  const updatedAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO preferences (userId, assets, investorType, content, updatedAt)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(userId) DO UPDATE SET
      assets = excluded.assets,
      investorType = excluded.investorType,
      content = excluded.content,
      updatedAt = excluded.updatedAt
  `).run(
    userId,
    JSON.stringify(assets),
    investorType,
    JSON.stringify(content),
    updatedAt
  );

  res.json({ message: "Preferences saved", updatedAt });
});

/* =========================
   Preferences - Get
   // Preferences GET: returns saved onboarding preferences (parsed from JSON strings)
========================= */
app.get("/api/preferences", auth, (req, res) => {
  const userId = req.user.userId;

  const row = db
    .prepare("SELECT assets, investorType, content, updatedAt FROM preferences WHERE userId = ?")
    .get(userId);

  if (!row) return res.json({ preferences: null });

  res.json({
    preferences: {
      assets: JSON.parse(row.assets || "[]"),
      investorType: row.investorType || "",
      content: JSON.parse(row.content || "[]"),
      updatedAt: row.updatedAt,
    },
  });
});

/* =========================
   AI Insight (HuggingFace Router)
   GET /api/ai-insight
   // AI Insight: generates short personalized insight using HuggingFace router with model fallbacks
// Uses user preferences (assets + investorType) to tailor the prompt.
========================= */
app.get("/api/ai-insight", auth, async (req, res) => {
  try {
    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) {
      return res.status(500).json({ error: "Missing HF_TOKEN in server .env" });
    }

    const FALLBACK_MODELS = [
      process.env.HF_MODEL || "meta-llama/Meta-Llama-3-8B-Instruct",
      "mistralai/Mistral-7B-Instruct-v0.2",
      "HuggingFaceH4/zephyr-7b-beta",
      "google/gemma-1.1-2b-it",
    ];

    
    const row = db
      .prepare("SELECT assets, investorType FROM preferences WHERE userId = ?")
      .get(req.user.userId);

    const prefs = row
      ? {
          assets: JSON.parse(row.assets || "[]"),
          investorType: row.investorType || "",
        }
      : null;

    const assetsTxt = prefs?.assets?.length ? prefs.assets.join(", ") : "BTC, ETH";
    const investorTxt = prefs?.investorType || "General";

    const messages = [
      {
        role: "system",
        content:
          "You are a helpful crypto assistant. " +
          "Return plain text only (no Markdown). " +
          "Write 2-3 short sentences. " +
          "End with: Risk note: <one short sentence>. " +
          "No financial advice.",
      },
      {
        role: "user",
        content: `Give today's crypto market insight tailored to: InvestorType=${investorTxt}, Assets=${assetsTxt}. Mention a risk note.`,
      },
    ];

    let lastError = null;

    for (const modelName of FALLBACK_MODELS) {
      const r = await fetchFn("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HF_TOKEN}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.7,
          max_tokens: 180,
        }),
      });

      const text = await r.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (r.ok) {
        const insight =
          data?.choices?.[0]?.message?.content?.trim?.() || "No insight returned.";

        return res.json({
          insight,
          model: modelName,
          updatedAt: new Date().toISOString(),
        });
      }

      lastError = { status: r.status, details: data, model: modelName };
    }

    return res.status(502).json({
      error: "AI provider error",
      triedModels: FALLBACK_MODELS,
      lastError,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error", message: err.message });
  }
});

/* =========================
   CoinGecko - Prices (cache + fallback)
   GET /api/prices?assets=BTC,ETH
   // CoinGecko prices: in-memory cache to reduce rate limits and provide fallback for UI stability
========================= */
const COINGECKO_ID_BY_SYMBOL = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  DOGE: "dogecoin",
  ADA: "cardano",
  XRP: "ripple",
};

// cache
let PRICES_CACHE = new Map(); // key: "BTC,ETH" -> { prices, updatedAt, cachedAt }
const PRICES_TTL = 2 * 60 * 1000; // 2 minutes

function pricesFallback(symbols) {
  // fallback 
  return symbols.map((s) => ({
    symbol: s,
    usd: 0,
    usd_24h_change: 0,
    note: "fallback",
  }));
}

app.get("/api/prices", async (req, res) => {
  const assetsParam = (req.query.assets || "").toString().trim();
  if (!assetsParam) {
    return res.status(400).json({
      error: "Missing assets query param",
      example: "/api/prices?assets=BTC,ETH",
    });
  }

  const symbols = assetsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const cacheKey = symbols.join(",");

  // cache
  const cached = PRICES_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < PRICES_TTL) {
    return res.json({ prices: cached.prices, updatedAt: cached.updatedAt, cached: true });
  }

  const ids = symbols.map((sym) => COINGECKO_ID_BY_SYMBOL[sym]).filter(Boolean);

  if (ids.length === 0) {
    return res.status(400).json({
      error: "No supported assets provided",
      supported: Object.keys(COINGECKO_ID_BY_SYMBOL),
    });
  }

  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price" +
      `?ids=${encodeURIComponent(ids.join(","))}` +
      "&vs_currencies=usd" +
      "&include_24hr_change=true";

    const r = await fetchFn(url);
    const text = await r.text();

    if (!r.ok) throw new Error(`CoinGecko failed (${r.status})`);

    const data = text ? JSON.parse(text) : {};

    const prices = symbols
      .map((sym) => {
        const id = COINGECKO_ID_BY_SYMBOL[sym];
        if (!id || !data[id]) return null;
        return {
          symbol: sym,
          usd: data[id].usd,
          usd_24h_change: data[id].usd_24h_change,
        };
      })
      .filter(Boolean);

    const payload = { prices, updatedAt: new Date().toISOString() };

    PRICES_CACHE.set(cacheKey, {
      prices,
      updatedAt: payload.updatedAt,
      cachedAt: Date.now(),
    });

    return res.json(payload);
  } catch (err) {

    if (cached) {
      return res.json({
        prices: cached.prices,
        updatedAt: cached.updatedAt,
        cached: true,
        note: "Served from cache due to CoinGecko error",
      });
    }

    
    return res.json({
      prices: pricesFallback(symbols),
      updatedAt: new Date().toISOString(),
      source: "fallback",
      note: "Fallback due to CoinGecko error",
    });
  }
});

/* =========================
   Market News – cache + fallback + 4 items + valid URL always
   GET /api/news
   // Market News: fetches from CryptoPanic with cache + safe URL normalization + fallback list
========================= */

const NEWS_FALLBACK = [
  {
    title: "Bitcoin steadies as markets wait for macro signals",
    url: "https://www.coindesk.com/",
    source: "Fallback",
    publishedAt: new Date().toISOString(),
  },
  {
    title: "Ethereum activity rises as L2 adoption grows",
    url: "https://cointelegraph.com/",
    source: "Fallback",
    publishedAt: new Date().toISOString(),
  },
  {
    title: "Altcoins see mixed performance amid low volatility",
    url: "https://decrypt.co/",
    source: "Fallback",
    publishedAt: new Date().toISOString(),
  },
  {
    title: "Crypto market pauses ahead of macro data",
    url: "https://www.bloomberg.com/crypto",
    source: "Fallback",
    publishedAt: new Date().toISOString(),
  },
];

// cache
let NEWS_CACHE = null;
let NEWS_CACHE_AT = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function safeUrl(maybeUrl) {
  try {
    const u = new URL(maybeUrl);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return "https://cryptopanic.com/";
  } catch {
    return "https://cryptopanic.com/";
  }
}

app.get("/api/news", auth, async (req, res) => {
  const now = Date.now();

  if (NEWS_CACHE && now - NEWS_CACHE_AT < CACHE_TTL) {
    return res.json({ ...NEWS_CACHE, cached: true });
  }

  const key = process.env.CRYPTOPANIC_KEY;

  if (!key) {
    return res.json({
      items: NEWS_FALLBACK.slice(0, 4),
      source: "fallback",
      updatedAt: new Date().toISOString(),
    });
  }

  try {
    const url =
      "https://cryptopanic.com/api/developer/v2/posts/?" +
      `auth_token=${encodeURIComponent(key)}` +
      "&public=true" +
      "&kind=news" +
      "&currencies=BTC,ETH";

    const r = await fetchFn(url);
    const text = await r.text();

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!r.ok) {
      throw new Error(`CryptoPanic failed (${r.status})`);
    }

    const results = Array.isArray(data?.results) ? data.results : [];

    const items = results.slice(0, 4).map((x) => ({
      title: x?.title || "Untitled",
      url: safeUrl(x?.url || x?.source?.url || "https://cryptopanic.com/"),
      source: x?.source?.title || "CryptoPanic",
      publishedAt: x?.published_at || x?.created_at || null,
    }));

    const response = {
      items,
      source: "cryptopanic",
      updatedAt: new Date().toISOString(),
    };

    NEWS_CACHE = response;
    NEWS_CACHE_AT = now;

    return res.json(response);
  } catch (err) {
    if (NEWS_CACHE) {
      return res.json({
        ...NEWS_CACHE,
        cached: true,
        note: "Served from cache due to API error",
      });
    }

    return res.json({
      items: NEWS_FALLBACK.slice(0, 4).map((n) => ({ ...n, url: safeUrl(n.url) })),
      source: "fallback",
      updatedAt: new Date().toISOString(),
      note: "Fallback due to server error",
    });
  }
});

/* =========================
   Votes (supports up/down/none)
   // Votes: stores per-user feedback per dashboard section (up/down/none). "none" deletes the row.
========================= */
app.post("/api/vote", auth, (req, res) => {
  const userId = req.user.userId;
  const { section, vote } = req.body || {};

  const allowedSections = ["news", "prices", "ai", "meme"];
  const allowedVotes = ["up", "down", "none"];

  if (!allowedSections.includes(section)) {
    return res.status(400).json({ error: "Invalid section", allowed: allowedSections });
  }
  if (!allowedVotes.includes(vote)) {
    return res.status(400).json({ error: "Invalid vote", allowed: allowedVotes });
  }

  const updatedAt = new Date().toISOString();

  // vote=none deletes existing vote
  if (vote === "none") {
    db.prepare("DELETE FROM votes WHERE userId = ? AND section = ?").run(userId, section);
    return res.json({ message: "Vote cleared", section, vote, updatedAt });
  }

  db.prepare(`
    INSERT INTO votes (userId, section, vote, updatedAt)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(userId, section)
    DO UPDATE SET vote = excluded.vote, updatedAt = excluded.updatedAt
  `).run(userId, section, vote, updatedAt);

  res.json({ message: "Vote saved", section, vote, updatedAt });
});


// Serve React build
app.use(express.static(path.join(__dirname, "../client/build")));

// SPA fallback (only for non-API routes)
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});



/* =========================
   Start server
   // Start HTTP server (PORT comes from hosting provider in production
========================= */
app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
