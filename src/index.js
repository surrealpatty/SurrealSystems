// src/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
const userRoutes = require('./routes/user');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const startServer = async () => {
  try {
    await testConnection();

    // ✅ Ensure database tables exist
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Server failed to start due to database error:', err.message);
    process.exit(1);
  }
};

startServer();
