// src/models/services.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user'); // ✅ important

const Service = sequelize.define('Service', {
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  price: DataTypes.FLOAT,
  userId: DataTypes.INTEGER
});

Service.belongsTo(User, { foreignKey: 'userId', as: 'user' });
module.exports = Service;
