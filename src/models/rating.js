const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rating = sequelize.define(
  'Rating',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    serviceId: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.INTEGER, allowNull: false }, // e.g., 1–5
    comment: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'ratings', timestamps: true }
);

module.exports = Rating;
