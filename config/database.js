const { Sequelize } = require('sequelize');

// Replace '' with your MySQL root password if you have one
const sequelize = new Sequelize('codecrowds', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

// Test the connection
sequelize.authenticate()
    .then(() => console.log('Database connected!'))
    .catch(err => console.error('Database connection failed:', err));

module.exports = sequelize;
