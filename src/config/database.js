// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use environment variables from Render or local .env
const database = process.env.DB_NAME || 'codecrowds_db';
const username = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const host = process.env.DB_HOST || 'localhost';
const dialect = process.env.DB_DIALECT || 'mysql';

// ✅ Safely handle DATABASE_URL for production
let sequelize;

if (process.env.DATABASE_URL) {
  // Example: mysql://user:password@host:3306/dbname
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // important for Render
      },
    },
    logging: false,
  });
} else {
  // Local or fallback connection
  sequelize = new Sequelize(database, username, password, {
    host,
    dialect,
    logging: false,
  });
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, testConnection };
