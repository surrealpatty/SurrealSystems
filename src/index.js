const express = require('express');
const cors = require('cors');
const path = require('path'); // for serving frontend
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
const userRoutes = require('./routes/user');
const serviceRoutes = require('./routes/service');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// Fallback for SPA (single page app)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
const startServer = async () => {
  try {
    await testConnection(); // test DB connection

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server failed to start due to database error.');
    process.exit(1);
  }
};

startServer();
