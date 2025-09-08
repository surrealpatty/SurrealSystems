const { Sequelize } = require('sequelize');

// MySQL connection: use Render env variables if deployed, fallback to local
const sequelize = new Sequelize(
    process.env.MYSQL_DB || 'codecrowds',
    process.env.MYSQL_USER || 'root',
    process.env.MYSQL_PASS || '',
    {
        host: process.env.MYSQL_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
    }
);

// Test the connection
sequelize.authenticate()
    .then(() => console.log('✅ Database connected!'))
    .catch(err => console.error('❌ Database connection failed:', err));

module.exports = sequelize;
