"use strict";
require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql', // âœ… change this to MySQL
    logging: true,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('âœ… MySQL connection successful!');
    }
    catch (err) {
        console.error('âŒ MySQL connection failed:', err.message);
    }
    finally {
        await sequelize.close();
    }
}
testConnection();


