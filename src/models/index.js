// src/models/index.js
const { sequelize } = require('../config/database');

const User = require('./user');
const Service = require('./service');
const Message = require('./message');
const Rating = require('./rating');

// ----------------- Associations -----------------

// User & Service
User.hasMany(Service, { as: 'services', foreignKey: 'userId' });
Service.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// User & Message
User.hasMany(Message, { as: 'sentMessages', foreignKey: 'senderId' });
User.hasMany(Message, { as: 'receivedMessages', foreignKey: 'receiverId' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });

// User & Rating
User.hasMany(Rating, { as: 'ratings', foreignKey: 'userId' });
Rating.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// Service & Rating
Service.hasMany(Rating, { as: 'ratings', foreignKey: 'serviceId' });
Rating.belongsTo(Service, { as: 'service', foreignKey: 'serviceId' });

module.exports = {
  sequelize,
  User,
  Service,
  Message,
  Rating,
};
