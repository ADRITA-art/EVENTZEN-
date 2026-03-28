const budgetService = require('../services/budget.service');

const parsePositiveNumber = (value, fieldName) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    const error = new Error(`${fieldName} must be a number greater than 0`);
    error.status = 400;
    throw error;
  }
  return parsed;
};

const parsePositiveInteger = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`${fieldName} must be a positive integer`);
    error.status = 400;
    throw error;
  }
  return parsed;
};

const addExpense = async (req, res, next) => {
  try {
    const eventId = parsePositiveInteger(req.body.eventId, 'eventId');
    const amount = parsePositiveNumber(req.body.amount, 'amount');
    const category = (req.body.category || '').trim();

    if (!category) {
      const error = new Error('category is required');
      error.status = 400;
      throw error;
    }

    const expense = await budgetService.addExpense({
      eventId,
      category,
      amount,
      description: req.body.description,
    });

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

const getExpensesByEventId = async (req, res, next) => {
  try {
    const eventId = parsePositiveInteger(req.params.eventId, 'eventId');
    const expenses = await budgetService.getExpensesByEventId(eventId);
    res.status(200).json(expenses);
  } catch (error) {
    next(error);
  }
};

const deleteExpenseById = async (req, res, next) => {
  try {
    const expenseId = parsePositiveInteger(req.params.id, 'id');
    const result = await budgetService.deleteExpenseById(expenseId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addExpense,
  getExpensesByEventId,
  deleteExpenseById,
};
