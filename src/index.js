// src/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./config/database');
const userRoutes = require('./routes/user');
const serviceRoutes = require('./routes/service');

const app = express();

/* ---------- Feature toggles (env) ---------- */
const ENABLE_HELMET = (process.env.ENABLE_HELMET ?? 'true') === 'true';
const ENABLE_RATE_LIMIT = (process.env.ENABLE_RATE_LIMIT ?? 'true') === 'true';
const ENABLE_SERVER_TIMING = (process.env.ENABLE_SERVER_TIMING ?? 'false') === 'true';
const ENABLE_STATIC_CACHE = (process.env.ENABLE_STATIC_CACHE ?? 'true') === 'true';

// Avoid gzipping tiny JSON (CPU). 0 = gzip everything. 10240 = ~10KB.
const COMPRESSION_THRESHOLD = Number(process.env.COMPRESSION_THRESHOLD ?? 10240);

/* ---------- Core middleware ---------- */
app.use(compression({ threshold: COMPRESSION_THRESHOLD }));
if (ENABLE_HELMET) app.use(helmet());

// CORS: allow configured origins; allow server-to-server calls.
// Also: super-fast preflight with caching.
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/server-to-server
    if (allowedOrigins.length === 0) return cb(null, true); // fallback if unset
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: origin not allowed'), false);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 204,
  preflightContinue: false
};
app.use(cors(corsOptions));
// Handle OPTIONS quickly + cache the preflight for 10 minutes
app.options('*', (req, res) => {
  res.set('Access-Control-Max-Age', '600');
  return res.sendStatus(204);
});

// Trust proxy for real client IP (Render/Heroku)
app.set('trust proxy', 1);

// Rate limit (guarded)
if (ENABLE_RATE_LIMIT) {
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    standardHeaders: true,
    legacyHeaders: false
  }));
}

app.use(express.json());

/* ---------- Server-Timing (safe) ---------- */
if (ENABLE_SERVER_TIMING) {
  app.set('etag', 'weak');
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    const origWriteHead = res.writeHead;
    res.writeHead = function (...args) {
      const ttfbMs = Number((process.hrtime.bigint() - start) / 1000000n);
      try { res.setHeader('Server-Timing', `app;dur=${ttfbMs}`); } catch {}
      return origWriteHead.apply(this, args);
    };
    res.on('finish', () => {
      const totalMs = Number((process.hrtime.bigint() - start) / 1000000n);
      if (totalMs > 300) console.warn(`[SLOW] ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${totalMs}ms`);
    });
    next();
  });
}

/* ---------- Fast probes to locate the bottleneck ---------- */
// 0) No DB, just Node/Express
app.get('/api/ping', (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.json({ ok: true, t: Date.now() });
});

// 1) DB-only roundtrip (no models). Fail fast if DB is slow.
app.get('/api/db-ping', async (req, res) => {
  const start = process.hrtime.bigint();
  try {
    // Use a raw lightweight query
    await sequelize.query('SELECT 1');
    const ms = Number((process.hrtime.bigint() - start) / 1000000n);
    res.set('Cache-Control', 'no-store');
    return res.json({ ok: true, dbMs: ms });
  } catch (err) {
    const ms = Number((process.hrtime.bigint() - start) / 1000000n);
    console.error('DB ping failed:', err?.message || err);
    return res.status(500).json({ ok: false, dbMs: ms, error: 'db-failure' });
  }
});

/* ---------- Your API routes ---------- */
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);

/* ---------- Health ---------- */
let dbStatus = 'starting';
let dbErrorMsg = null;
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    ts: Date.now(),
    uptime: process.uptime(),
    db: dbStatus,
    ...(dbErrorMsg ? { dbError: dbErrorMsg } : {})
  });
});

/* ---------- Static frontend ---------- */
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir, ENABLE_STATIC_CACHE ? {
  maxAge: '7d', etag: true, lastModified: true, immutable: true
} : {}));

app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(publicDir, 'index.html'));
});

/* ---------- 404 & Errors ---------- */
app.use((req, res) => res.status(404).json({ success: false, error: { message: 'Not found' } }));
app.use((err, req, res, next) => {
  console.error('🔥 Uncaught error:', err.message);
  const status = err.statusCode || 500;
  const message = err.expose ? err.message : 'Internal server error';
  res.status(status).json({ success: false, error: { message } });
});

/* ---------- Boot ---------- */
const PORT = process.env.PORT || 10000;

async function boot() {
  try {
    await sequelize.authenticate();
    const alter = process.env.DB_ALTER === 'true' && process.env.NODE_ENV !== 'production';
    await sequelize.sync({ alter });
    dbStatus = 'ready'; dbErrorMsg = null;
    console.log('✅ Database ready (alter:', alter, ')');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    dbStatus = 'error'; dbErrorMsg = err?.message || 'DB init failed';
    console.error('❌ Failed to start: DB init error:', err);
    if (process.env.NODE_ENV === 'production') process.exit(1);
    app.listen(PORT, () => console.log(`🚀 Dev server on http://localhost:${PORT} (DB error)`));
  }
}
boot();
