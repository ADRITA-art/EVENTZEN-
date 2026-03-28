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

const createBudget = async (req, res, next) => {
  try {
    const eventId = parsePositiveInteger(req.body.eventId, 'eventId');
    const totalBudget = parsePositiveNumber(req.body.totalBudget, 'totalBudget');

    const budget = await budgetService.createBudget({ eventId, totalBudget });

    res.status(201).json({
      id: budget.id,
      eventId: budget.eventId,
      totalBudget: budget.totalBudget,
      actualCost: budget.actualCost,
      createdAt: budget.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

const getBudgetByEventId = async (req, res, next) => {
  try {
    const eventId = parsePositiveInteger(req.params.eventId, 'eventId');
    const budgetSummary = await budgetService.getBudgetByEventId(eventId);

    res.status(200).json(budgetSummary);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBudget,
  getBudgetByEventId,
};
