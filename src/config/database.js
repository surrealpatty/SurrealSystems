// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use individual DB_* variables from .env
const sequelize = new Sequelize(
  process.env.DB_NAME,      // database name
  process.env.DB_USER,      // database username
  process.env.DB_PASSWORD,  // database password
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432, // PostgreSQL default port
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,          // Render requires SSL
        rejectUnauthorized: false,
      },
    },
    logging: false,
  }
);

// Test DB connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully.');
  } catch (err) {
    console.error('❌ Unable to connect to PostgreSQL:', err.message);
  }
};

module.exports = { sequelize, testConnection };
