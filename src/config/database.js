const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use a proper connection string for Render
const sequelize = new Sequelize(
  process.env.DB_NAME,          // database
  process.env.DB_USER,          // username
  process.env.DB_PASSWORD,      // password
  {
    host: process.env.DB_HOST,  // host
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // must be false for Render
      },
    },
    logging: false,
  }
);

// Test the DB connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully.');
  } catch (err) {
    console.error('❌ Unable to connect to PostgreSQL:', err.message);
  }
};

module.exports = { sequelize, testConnection };
