const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { User } = require('./User');

const Service = sequelize.define('Service', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
}, {
  tableName: 'services',
  timestamps: true
});

// Associations
Service.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = { Service };
