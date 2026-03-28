const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventBudget = sequelize.define(
  'EventBudget',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: {
        min: 1,
      },
    },
    totalBudget: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    actualCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
  },
  {
    tableName: 'EventBudget',
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = EventBudget;
