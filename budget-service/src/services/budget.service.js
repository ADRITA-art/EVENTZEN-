const { Expense, EventBudget, sequelize } = require('../models');

const toMoney = (value) => Number.parseFloat(value || 0).toFixed(2);

const createBudget = async ({ eventId, totalBudget }) => {
  const existing = await EventBudget.findOne({ where: { eventId } });
  if (existing) {
    const error = new Error('Budget already exists for this eventId');
    error.status = 409;
    throw error;
  }

  const budget = await EventBudget.create({
    eventId,
    totalBudget,
    actualCost: 0,
  });

  return budget;
};

const updateBudgetByEventId = async (eventId, totalBudget) => {
  const budget = await EventBudget.findOne({ where: { eventId } });
  if (!budget) {
    const error = new Error('Budget not found for this eventId');
    error.status = 404;
    throw error;
  }

  await budget.update({ totalBudget });
  return budget;
};

const getBudgetByEventId = async (eventId) => {
  const budget = await EventBudget.findOne({ where: { eventId } });
  if (!budget) {
    const error = new Error('Budget not found for this eventId');
    error.status = 404;
    throw error;
  }

  const totalBudget = Number.parseFloat(budget.totalBudget);
  const actualCost = Number.parseFloat(budget.actualCost);
  const remaining = (totalBudget - actualCost).toFixed(2);

  return {
    eventId: budget.eventId,
    totalBudget: toMoney(totalBudget),
    actualCost: toMoney(actualCost),
    remaining,
  };
};

const addExpense = async ({ eventId, category, amount, description }) => {
  return sequelize.transaction(async (transaction) => {
    const budget = await EventBudget.findOne({
      where: { eventId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!budget) {
      const error = new Error('Cannot add expense. Budget not found for this eventId');
      error.status = 404;
      throw error;
    }

    const expense = await Expense.create(
      {
        eventId,
        category,
        amount,
        description: description || null,
      },
      { transaction }
    );

    const updatedActualCost = (
      Number.parseFloat(budget.actualCost) + Number.parseFloat(amount)
    ).toFixed(2);

    await budget.update({ actualCost: updatedActualCost }, { transaction });

    return expense;
  });
};

const getExpensesByEventId = async (eventId) => {
  const expenses = await Expense.findAll({
    where: { eventId },
    order: [['createdAt', 'DESC']],
  });

  return expenses;
};

const deleteExpenseById = async (expenseId) => {
  return sequelize.transaction(async (transaction) => {
    const expense = await Expense.findByPk(expenseId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!expense) {
      const error = new Error('Expense not found');
      error.status = 404;
      throw error;
    }

    const budget = await EventBudget.findOne({
      where: { eventId: expense.eventId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!budget) {
      const error = new Error('Related budget not found for this expense');
      error.status = 404;
      throw error;
    }

    const updatedActualCost = Math.max(
      0,
      Number.parseFloat(budget.actualCost) - Number.parseFloat(expense.amount)
    ).toFixed(2);

    await budget.update({ actualCost: updatedActualCost }, { transaction });
    await expense.destroy({ transaction });

    return {
      message: 'Expense deleted successfully',
      eventId: budget.eventId,
      actualCost: toMoney(updatedActualCost),
    };
  });
};

module.exports = {
  createBudget,
  updateBudgetByEventId,
  getBudgetByEventId,
  addExpense,
  getExpensesByEventId,
  deleteExpenseById,
};
