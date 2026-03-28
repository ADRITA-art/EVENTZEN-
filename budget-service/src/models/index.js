const sequelize = require('../config/database');
const EventBudget = require('./eventBudget.model');
const Expense = require('./expense.model');

module.exports = {
  sequelize,
  EventBudget,
  Expense,
};
