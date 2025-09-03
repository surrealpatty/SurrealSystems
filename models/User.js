const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('sqlite:database.sqlite'); // replace with MySQL if needed

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false }
});

module.exports = { User, sequelize };
