jest.mock('../../../src/services/budget.service', () => ({
  addExpense: jest.fn(),
  getExpensesByEventId: jest.fn(),
  deleteExpenseById: jest.fn(),
}));

const expenseController = require('../../../src/controllers/expense.controller');
const budgetService = require('../../../src/services/budget.service');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('expense.controller', () => {
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = makeRes();
    next = jest.fn();
  });

  test('addExpense returns 201', async () => {
    budgetService.addExpense.mockResolvedValue({ id: 1 });

    await expenseController.addExpense(
      { body: { eventId: 1, amount: 20.5, category: 'Travel', description: 'Cab' } },
      res,
      next
    );

    expect(budgetService.addExpense).toHaveBeenCalledWith({
      eventId: 1,
      amount: 20.5,
      category: 'Travel',
      description: 'Cab',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });

  test('addExpense validates category', async () => {
    await expenseController.addExpense({ body: { eventId: 1, amount: 20, category: '   ' } }, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  test('addExpense validates amount', async () => {
    await expenseController.addExpense({ body: { eventId: 1, amount: 0, category: 'Food' } }, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  test('getExpensesByEventId returns 200', async () => {
    budgetService.getExpensesByEventId.mockResolvedValue([{ id: 1 }]);

    await expenseController.getExpensesByEventId({ params: { eventId: '2' } }, res, next);

    expect(budgetService.getExpensesByEventId).toHaveBeenCalledWith(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  test('getExpensesByEventId validates eventId', async () => {
    await expenseController.getExpensesByEventId({ params: { eventId: '-1' } }, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  test('deleteExpenseById returns 200', async () => {
    budgetService.deleteExpenseById.mockResolvedValue({ message: 'ok' });

    await expenseController.deleteExpenseById({ params: { id: '3' } }, res, next);

    expect(budgetService.deleteExpenseById).toHaveBeenCalledWith(3);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'ok' });
  });

  test('deleteExpenseById validates id', async () => {
    await expenseController.deleteExpenseById({ params: { id: 'abc' } }, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });
});
