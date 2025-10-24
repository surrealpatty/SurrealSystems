// src/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./config/database');
// NOTE: your repo uses singular 'message.js' per file tree
const userRoutes = require('./routes/user');
const serviceRoutes = require('./routes/service');
const ratingRoutes = require('./routes/rating');
const messageRoutes = require('./routes/message');

const app = express();

/* ── Core middleware ─────────────────────────────────────────────────── */
app.use(compression({ threshold: 0 }));
app.use(helmet()); // sensible secure headers

// Tight CORS: allow only the origins you configure in env
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Allow null/undefined origin for non-browser clients (curl, server-to-server)
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: origin not allowed'), false);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// If you deploy behind a proxy (Render/Heroku, etc.), trust it for rate limits
app.set('trust proxy', 1);

// Basic rate limit: 100 req / 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false
}));

app.use(express.json());

/* ── Static frontend (../public) ────────────────────────────────────────
   NOTE: index.js lives in /src, while 'public' is at repo root.
         So we must go up one directory.
*/
app.use(express.static(path.join(__dirname, '../public')));

/* ── Health endpoint (does NOT block on DB) ──────────────────────────── */
let dbStatus = 'starting'; // 'starting' | 'ready' | 'error'
let dbErrorMsg = null;

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    ts: Date.now(),
    db: dbStatus,
    ...(dbErrorMsg ? { dbError: dbErrorMsg } : {})
  });
});

/* ── API routes ──────────────────────────────────────────────────────── */
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/messages', messageRoutes);

/* ── Catch-all to serve SPA (optional; keep if you want deep links) ──── */
app.get('*', (req, res, next) => {
  // Only handle non-API routes here
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

/* ── 404 & Error handlers ────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ success: false, error: { message: 'Not found' } });
});

app.use((err, req, res, next) => {
  // Avoid leaking internals
  console.error('🔥 Uncaught error:', err);
  const status = err.statusCode || 500;
  const message = err.expose ? err.message : 'Internal server error';
  res.status(status).json({ success: false, error: { message } });
});

/* ── Start server immediately ────────────────────────────────────────── */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));

/* ── Initialize DB in background (safe for prod) ─────────────────────── */
(async function initDatabase() {
  try {
    await sequelize.authenticate();
    // Avoid alter:true in real production; prefer migrations.
    const alter = process.env.DB_ALTER === 'true';
    await sequelize.sync({ alter });
    dbStatus = 'ready';
    dbErrorMsg = null;
    console.log('✅ Database ready (alter:', alter, ')');
  } catch (err) {
    dbStatus = 'error';
    dbErrorMsg = err?.message || 'DB init failed';
    console.error('❌ Database init failed:', err);
  }
})();
