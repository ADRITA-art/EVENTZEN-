const { Expense, EventBudget, sequelize } = require('../models');

const toMoney = (value) => Number.parseFloat(value || 0).toFixed(2);

const upsertEstimatedCost = async ({ eventId, estimatedCost }) => {
  const budget = await EventBudget.findOne({ where: { eventId } });

  if (!budget) {
    return EventBudget.create({
      eventId,
      estimatedCost,
      totalBudget: null,
      actualCost: 0,
      revenue: 0,
    });
  }

  await budget.update({ estimatedCost });
  return budget;
};

const setTotalBudget = async ({ eventId, totalBudget }) => {
  const budget = await EventBudget.findOne({ where: { eventId } });

  if (!budget) {
    return EventBudget.create({
      eventId,
      estimatedCost: 0,
      totalBudget,
      actualCost: 0,
      revenue: 0,
    });
  }

  await budget.update({ totalBudget });
  return budget;
};

const syncRevenue = async ({ eventId, revenue }) => {
  const budget = await EventBudget.findOne({ where: { eventId } });

  if (!budget) {
    return EventBudget.create({
      eventId,
      estimatedCost: 0,
      totalBudget: null,
      actualCost: 0,
      revenue,
    });
  }

  await budget.update({ revenue });
  return budget;
};

const getBudgetByEventId = async (eventId) => {
  const budget = await EventBudget.findOne({ where: { eventId } });
  if (!budget) {
    const error = new Error('Budget not found for this eventId');
    error.status = 404;
    throw error;
  }

  const totalBudget = budget.totalBudget === null ? null : Number.parseFloat(budget.totalBudget);
  const estimatedCost = Number.parseFloat(budget.estimatedCost);
  const actualCost = Number.parseFloat(budget.actualCost);
  const revenue = Number.parseFloat(budget.revenue);
  const remainingBudget = totalBudget === null ? null : (totalBudget - actualCost).toFixed(2);
  const profit = (revenue - actualCost).toFixed(2);

  return {
    eventId: budget.eventId,
    totalBudget: totalBudget === null ? null : toMoney(totalBudget),
    estimatedCost: toMoney(estimatedCost),
    actualCost: toMoney(actualCost),
    revenue: toMoney(revenue),
    remainingBudget,
    profit,
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
  upsertEstimatedCost,
  setTotalBudget,
  syncRevenue,
  getBudgetByEventId,
  addExpense,
  getExpensesByEventId,
  deleteExpenseById,
};
