const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'users',   // ensure lowercase table name
    timestamps: true
});

// Optional: sync table automatically for development
User.sync({ alter: true })
    .then(() => console.log('User table synced'))
    .catch(err => console.error('Failed to sync User table:', err));

module.exports = User;
