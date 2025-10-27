// src/models/service.js
module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const Service = sequelize.define('Service', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // explicit DB column mapping (use the DB column name `userId` that currently exists)
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'userId' }, // owner
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.DECIMAL(10,2), allowNull: true }
  }, {
    tableName: 'services',
    timestamps: true,
    // keep underscored true (global convention); explicit `field` above will override it for this column
    underscored: true
  });

  return Service;
};
