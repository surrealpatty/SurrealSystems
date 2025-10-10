// src/models/service.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');

const Service = sequelize.define('Service', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'services', timestamps: true });

// Define associations
Service.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Service, { foreignKey: 'userId' });

module.exports = Service;
