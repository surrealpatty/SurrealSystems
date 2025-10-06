// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  // Use Render's PostgreSQL URL
  console.log('✅ Using Render DATABASE_URL (PostgreSQL)');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // important for Render
      },
    },
    logging: false,
  });
} else {
  // Local MySQL fallback
  console.log('✅ Using local MySQL database');
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      logging: false,
    }
  );
}

// Test the DB connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (err) {
    console.error('❌ Unable to connect to database:', err.message);
  }
};

module.exports = { sequelize, testConnection };
