const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('codecrowds', 'root', 'YLtr+TlSWaRifesplsuPacLChe0', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = sequelize;
