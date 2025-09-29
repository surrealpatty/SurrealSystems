const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { User } = require('./User'); // import User for association

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  price: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  userId: { // foreign key to User
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'services',
  timestamps: true
});

// Associations
Service.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Service, { foreignKey: 'userId', as: 'services' });

module.exports = { Service };
