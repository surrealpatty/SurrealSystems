const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('codecrowds', 'root', 'YOUR_MYSQL_PASSWORD', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

module.exports = sequelize;
