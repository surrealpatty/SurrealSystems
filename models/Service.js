const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const User = require('/user'); // Make sure the file name matches exactly (case-sensitive)

class Service extends Model {}

Service.init(
    {
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: 0 // Ensure price is not negative
            }
        }
    },
    {
        sequelize,
        modelName: 'Service',
        timestamps: true // Optional: adds createdAt and updatedAt
    }
);

// Associations
User.hasMany(Service, { foreignKey: 'userId', onDelete: 'CASCADE' }); 
Service.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = Service;
