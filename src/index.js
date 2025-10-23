// src/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
const userRoutes = require('./routes/user');
const serviceRoutes = require('./routes/service');
const ratingRoutes = require('./routes/rating');
const messageRoutes = require('./routes/messages');

const app = express();

/* ── Middlewares ─────────────────────────────────────────────────────── */
app.use(compression({ threshold: 0 }));
app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
}));
app.use(express.json());

/* ── Static frontend (public/) ───────────────────────────────────────── */
app.use(express.static(path.join(__dirname, '../public')));

/* ── Health: always available, does NOT block on DB ──────────────────── */
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

/* ── 404 & Error handlers ────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ success: false, error: { message: 'Not found' } });
});

app.use((err, req, res, next) => {
  console.error('🔥 Uncaught error:', err);
  const status = err.statusCode || 500;
  const message = err.expose ? err.message : 'Internal server error';
  res.status(status).json({ success: false, error: { message } });
});

/* ── Start HTTP server immediately ───────────────────────────────────── */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));

/* ── Initialize DB in background (don’t block server start) ──────────── */
(async function initDatabase(){
  try {
    await testConnection();
    // NOTE: avoid alter:true in production; use migrations instead
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
