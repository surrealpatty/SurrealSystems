const express = require('express');
const cors = require('cors');
const { sequelize, testConnection } = require('./config/database');
const serviceRoutes = require('./routes/service');
const { User } = require('./models/user');
const { Service } = require('./models/service');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to CodeCrowds API!');
});

// Services routes
app.use('/services', serviceRoutes);

// Test DB connection and sync models
(async () => {
  try {
    await testConnection();
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully.');
  } catch (err) {
    console.error('❌ Database sync failed:', err);
  }
})();

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
