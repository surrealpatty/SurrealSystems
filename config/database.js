const { Sequelize } = require('sequelize');

// Use DATABASE_URL if available, otherwise fallback to individual env variables
const connectionString = process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false // 🔑 Required for Render Postgres
        }
    },
    logging: console.log, // optional, shows SQL queries in console
});

sequelize.authenticate()
    .then(() => console.log('✅ PostgreSQL connected'))
    .catch(err => console.error('❌ PostgreSQL connection failed:', err));

module.exports = { sequelize };
