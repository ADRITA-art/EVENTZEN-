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

const parseNonNegativeNumberOptional = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    const error = new Error(`${fieldName} must be a number greater than or equal to 0`);
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

const upsertEstimatedCost = async (req, res, next) => {
  try {
    const eventId = parsePositiveInteger(req.body.eventId, 'eventId');
    const estimatedCost = parseNonNegativeNumberOptional(req.body.estimatedCost, 'estimatedCost');

    if (estimatedCost === undefined) {
      const error = new Error('estimatedCost is required');
      error.status = 400;
      throw error;
    }

    const budget = await budgetService.upsertEstimatedCost({ eventId, estimatedCost });

    res.status(200).json({
      id: budget.id,
      eventId: budget.eventId,
      estimatedCost: budget.estimatedCost,
      totalBudget: budget.totalBudget,
      actualCost: budget.actualCost,
      revenue: budget.revenue,
      createdAt: budget.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

const setTotalBudget = async (req, res, next) => {
  try {
    const eventId = parsePositiveInteger(req.body.eventId, 'eventId');
    const totalBudget = parseNonNegativeNumberOptional(req.body.totalBudget, 'totalBudget');

    if (totalBudget === undefined) {
      const error = new Error('totalBudget is required');
      error.status = 400;
      throw error;
    }

    const budget = await budgetService.setTotalBudget({ eventId, totalBudget });

    res.status(200).json({
      id: budget.id,
      eventId: budget.eventId,
      estimatedCost: budget.estimatedCost,
      totalBudget: budget.totalBudget,
      actualCost: budget.actualCost,
      revenue: budget.revenue,
      createdAt: budget.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

const syncRevenue = async (req, res, next) => {
  try {
    const eventId = parsePositiveInteger(req.params.eventId, 'eventId');
    const revenue = parseNonNegativeNumberOptional(req.body.revenue, 'revenue');

    if (revenue === undefined) {
      const error = new Error('revenue is required');
      error.status = 400;
      throw error;
    }

    const budget = await budgetService.syncRevenue({ eventId, revenue });

    res.status(200).json({
      id: budget.id,
      eventId: budget.eventId,
      estimatedCost: budget.estimatedCost,
      totalBudget: budget.totalBudget,
      actualCost: budget.actualCost,
      revenue: budget.revenue,
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
  upsertEstimatedCost,
  setTotalBudget,
  syncRevenue,
  getBudgetByEventId,
};
