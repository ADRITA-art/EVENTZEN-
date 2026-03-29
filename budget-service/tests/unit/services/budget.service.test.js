jest.mock('../../../src/models', () => ({
  EventBudget: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Expense: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

const { EventBudget, Expense, sequelize } = require('../../../src/models');
const budgetService = require('../../../src/services/budget.service');

describe('budget.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertEstimatedCost', () => {
    test('creates budget when none exists', async () => {
      EventBudget.findOne.mockResolvedValue(null);
      EventBudget.create.mockResolvedValue({ id: 1, eventId: 5, estimatedCost: 1500 });

      const result = await budgetService.upsertEstimatedCost({ eventId: 5, estimatedCost: 1500 });

      expect(EventBudget.create).toHaveBeenCalledWith({
        eventId: 5,
        estimatedCost: 1500,
        totalBudget: null,
        actualCost: 0,
        revenue: 0,
      });
      expect(result).toEqual({ id: 1, eventId: 5, estimatedCost: 1500 });
    });

    test('updates existing budget', async () => {
      const budget = { update: jest.fn().mockResolvedValue(undefined) };
      EventBudget.findOne.mockResolvedValue(budget);

      const result = await budgetService.upsertEstimatedCost({ eventId: 2, estimatedCost: 400 });

      expect(budget.update).toHaveBeenCalledWith({ estimatedCost: 400 });
      expect(result).toBe(budget);
    });
  });

  describe('setTotalBudget', () => {
    test('creates record when missing', async () => {
      EventBudget.findOne.mockResolvedValue(null);
      EventBudget.create.mockResolvedValue({ id: 2, totalBudget: 3000 });

      const result = await budgetService.setTotalBudget({ eventId: 7, totalBudget: 3000 });

      expect(EventBudget.create).toHaveBeenCalledWith({
        eventId: 7,
        estimatedCost: 0,
        totalBudget: 3000,
        actualCost: 0,
        revenue: 0,
      });
      expect(result).toEqual({ id: 2, totalBudget: 3000 });
    });

    test('updates existing budget', async () => {
      const budget = { update: jest.fn().mockResolvedValue(undefined) };
      EventBudget.findOne.mockResolvedValue(budget);

      await budgetService.setTotalBudget({ eventId: 4, totalBudget: 999.99 });

      expect(budget.update).toHaveBeenCalledWith({ totalBudget: 999.99 });
    });
  });

  describe('syncRevenue', () => {
    test('creates record when missing', async () => {
      EventBudget.findOne.mockResolvedValue(null);
      EventBudget.create.mockResolvedValue({ id: 3, revenue: 550 });

      const result = await budgetService.syncRevenue({ eventId: 9, revenue: 550 });

      expect(EventBudget.create).toHaveBeenCalledWith({
        eventId: 9,
        estimatedCost: 0,
        totalBudget: null,
        actualCost: 0,
        revenue: 550,
      });
      expect(result).toEqual({ id: 3, revenue: 550 });
    });

    test('updates existing budget', async () => {
      const budget = { update: jest.fn().mockResolvedValue(undefined) };
      EventBudget.findOne.mockResolvedValue(budget);

      await budgetService.syncRevenue({ eventId: 9, revenue: 1200 });

      expect(budget.update).toHaveBeenCalledWith({ revenue: 1200 });
    });
  });

  describe('getBudgetByEventId', () => {
    test('throws 404 when budget does not exist', async () => {
      EventBudget.findOne.mockResolvedValue(null);

      await expect(budgetService.getBudgetByEventId(77)).rejects.toMatchObject({
        status: 404,
        message: 'Budget not found for this eventId',
      });
    });

    test('returns computed budget summary', async () => {
      EventBudget.findOne.mockResolvedValue({
        eventId: 11,
        totalBudget: '1000.00',
        estimatedCost: '750.00',
        actualCost: '250.50',
        revenue: '400.00',
      });

      const result = await budgetService.getBudgetByEventId(11);

      expect(result).toEqual({
        eventId: 11,
        totalBudget: '1000.00',
        estimatedCost: '750.00',
        actualCost: '250.50',
        revenue: '400.00',
        remainingBudget: '749.50',
        profit: '149.50',
      });
    });

    test('returns null remainingBudget when totalBudget is null', async () => {
      EventBudget.findOne.mockResolvedValue({
        eventId: 12,
        totalBudget: null,
        estimatedCost: '0.00',
        actualCost: '10.00',
        revenue: '20.00',
      });

      const result = await budgetService.getBudgetByEventId(12);

      expect(result.remainingBudget).toBeNull();
      expect(result.profit).toBe('10.00');
    });
  });

  describe('addExpense', () => {
    test('adds expense and updates actualCost in a transaction', async () => {
      const transaction = { LOCK: { UPDATE: 'UPDATE' } };
      const budget = {
        actualCost: '30.00',
        update: jest.fn().mockResolvedValue(undefined),
      };
      const createdExpense = { id: 5, eventId: 4, amount: 20 };

      sequelize.transaction.mockImplementation(async (callback) => callback(transaction));
      EventBudget.findOne.mockResolvedValue(budget);
      Expense.create.mockResolvedValue(createdExpense);

      const result = await budgetService.addExpense({
        eventId: 4,
        category: 'Food',
        amount: 20,
        description: 'Snacks',
      });

      expect(Expense.create).toHaveBeenCalledWith(
        {
          eventId: 4,
          category: 'Food',
          amount: 20,
          description: 'Snacks',
        },
        { transaction }
      );
      expect(budget.update).toHaveBeenCalledWith({ actualCost: '50.00' }, { transaction });
      expect(result).toBe(createdExpense);
    });

    test('throws 404 when budget is missing', async () => {
      const transaction = { LOCK: { UPDATE: 'UPDATE' } };
      sequelize.transaction.mockImplementation(async (callback) => callback(transaction));
      EventBudget.findOne.mockResolvedValue(null);

      await expect(
        budgetService.addExpense({ eventId: 4, category: 'Food', amount: 10, description: null })
      ).rejects.toMatchObject({
        status: 404,
        message: 'Cannot add expense. Budget not found for this eventId',
      });
    });
  });

  describe('getExpensesByEventId', () => {
    test('returns all expenses sorted by createdAt desc', async () => {
      const expenses = [{ id: 1 }, { id: 2 }];
      Expense.findAll.mockResolvedValue(expenses);

      const result = await budgetService.getExpensesByEventId(20);

      expect(Expense.findAll).toHaveBeenCalledWith({
        where: { eventId: 20 },
        order: [['createdAt', 'DESC']],
      });
      expect(result).toBe(expenses);
    });
  });

  describe('deleteExpenseById', () => {
    test('deletes expense and updates budget actualCost', async () => {
      const transaction = { LOCK: { UPDATE: 'UPDATE' } };
      const expense = {
        eventId: 10,
        amount: '25.00',
        destroy: jest.fn().mockResolvedValue(undefined),
      };
      const budget = {
        eventId: 10,
        actualCost: '100.00',
        update: jest.fn().mockResolvedValue(undefined),
      };

      sequelize.transaction.mockImplementation(async (callback) => callback(transaction));
      Expense.findByPk.mockResolvedValue(expense);
      EventBudget.findOne.mockResolvedValue(budget);

      const result = await budgetService.deleteExpenseById(3);

      expect(budget.update).toHaveBeenCalledWith({ actualCost: '75.00' }, { transaction });
      expect(expense.destroy).toHaveBeenCalledWith({ transaction });
      expect(result).toEqual({
        message: 'Expense deleted successfully',
        eventId: 10,
        actualCost: '75.00',
      });
    });

    test('does not let actualCost drop below zero', async () => {
      const transaction = { LOCK: { UPDATE: 'UPDATE' } };
      const expense = {
        eventId: 10,
        amount: '60.00',
        destroy: jest.fn().mockResolvedValue(undefined),
      };
      const budget = {
        eventId: 10,
        actualCost: '40.00',
        update: jest.fn().mockResolvedValue(undefined),
      };

      sequelize.transaction.mockImplementation(async (callback) => callback(transaction));
      Expense.findByPk.mockResolvedValue(expense);
      EventBudget.findOne.mockResolvedValue(budget);

      const result = await budgetService.deleteExpenseById(8);

      expect(result.actualCost).toBe('0.00');
    });

    test('throws when expense is not found', async () => {
      const transaction = { LOCK: { UPDATE: 'UPDATE' } };
      sequelize.transaction.mockImplementation(async (callback) => callback(transaction));
      Expense.findByPk.mockResolvedValue(null);

      await expect(budgetService.deleteExpenseById(100)).rejects.toMatchObject({
        status: 404,
        message: 'Expense not found',
      });
    });

    test('throws when related budget is not found', async () => {
      const transaction = { LOCK: { UPDATE: 'UPDATE' } };
      const expense = { eventId: 7, amount: '5.00' };
      sequelize.transaction.mockImplementation(async (callback) => callback(transaction));
      Expense.findByPk.mockResolvedValue(expense);
      EventBudget.findOne.mockResolvedValue(null);

      await expect(budgetService.deleteExpenseById(101)).rejects.toMatchObject({
        status: 404,
        message: 'Related budget not found for this expense',
      });
    });
  });
});
