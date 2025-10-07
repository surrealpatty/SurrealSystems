const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
const userRoutes = require('./routes/user');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
const startServer = async () => {
  try {
    await testConnection(); // test DB connection

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Server failed to start due to database error:', err.message);
    process.exit(1);
  }
};

startServer();
