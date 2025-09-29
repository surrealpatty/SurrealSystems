require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize, testConnection } = require('./config/database');
const userRoutes = require('./routes/user');
const serviceRoutes = require('./routes/service');

const app = express();
app.use(express.json());

// ---------------- API Routes ----------------
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);

// ---------------- Serve Frontend ----------------
// public folder is at project root
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// SPA routing: all non-API routes serve index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    await sequelize.sync(); // ensures tables exist
    app.listen(PORT, () =>
      console.log(`🚀 CodeCrowds API & frontend running on port ${PORT}`)
    );
  } catch (err) {
    console.error('Server failed to start:', err);
  }
};

startServer();
