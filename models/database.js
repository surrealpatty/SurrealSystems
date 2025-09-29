const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql', // ✅ Use MySQL
        logging: false
    }
);

// Test connection function
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL connected');
    } catch (err) {
        console.error('❌ MySQL connection failed:', err);
        throw err;
    }
}

module.exports = { sequelize, testConnection };
