const { Sequelize } = require('sequelize');

// MySQL connection for Render or local
const sequelize = new Sequelize('codecrowds', 'root', '', {
    host: 'localhost',   // Change to your Render DB host if needed
    dialect: 'mysql',
    logging: false
});

// Test connection
sequelize.authenticate()
    .then(() => console.log('Database connected!'))
    .catch(err => console.error('Database connection failed:', err));

module.exports = sequelize;
