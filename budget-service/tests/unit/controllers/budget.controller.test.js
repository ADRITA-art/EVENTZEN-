jest.mock('../../../src/services/budget.service', () => ({
  upsertEstimatedCost: jest.fn(),
  setTotalBudget: jest.fn(),
  syncRevenue: jest.fn(),
  getBudgetByEventId: jest.fn(),
}));

const budgetController = require('../../../src/controllers/budget.controller');
const budgetService = require('../../../src/services/budget.service');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('budget.controller', () => {
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = makeRes();
    next = jest.fn();
  });

  test('upsertEstimatedCost returns 200 with body', async () => {
    budgetService.upsertEstimatedCost.mockResolvedValue({
      id: 1,
      eventId: 2,
      estimatedCost: 500,
      totalBudget: null,
      actualCost: 0,
      revenue: 0,
      createdAt: 'x',
    });

    await budgetController.upsertEstimatedCost(
      { body: { eventId: 2, estimatedCost: 500 } },
      res,
      next
    );

    expect(budgetService.upsertEstimatedCost).toHaveBeenCalledWith({ eventId: 2, estimatedCost: 500 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  test('upsertEstimatedCost validates required estimatedCost', async () => {
    await budgetController.upsertEstimatedCost({ body: { eventId: 2 } }, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    expect(budgetService.upsertEstimatedCost).not.toHaveBeenCalled();
  });

  test('setTotalBudget returns 200 with body', async () => {
    budgetService.setTotalBudget.mockResolvedValue({
      id: 1,
      eventId: 2,
      estimatedCost: 0,
      totalBudget: 2000,
      actualCost: 0,
      revenue: 0,
      createdAt: 'x',
    });

    await budgetController.setTotalBudget({ body: { eventId: 2, totalBudget: 2000 } }, res, next);

    expect(budgetService.setTotalBudget).toHaveBeenCalledWith({ eventId: 2, totalBudget: 2000 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('setTotalBudget validates totalBudget', async () => {
    await budgetController.setTotalBudget({ body: { eventId: 2, totalBudget: -1 } }, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  test('syncRevenue returns 200 with body', async () => {
    budgetService.syncRevenue.mockResolvedValue({
      id: 1,
      eventId: 3,
      estimatedCost: 0,
      totalBudget: null,
      actualCost: 0,
      revenue: 120,
      createdAt: 'x',
    });

    await budgetController.syncRevenue({ params: { eventId: '3' }, body: { revenue: 120 } }, res, next);

    expect(budgetService.syncRevenue).toHaveBeenCalledWith({ eventId: 3, revenue: 120 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('syncRevenue validates required revenue', async () => {
    await budgetController.syncRevenue({ params: { eventId: '3' }, body: {} }, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  test('getBudgetByEventId returns 200 with summary', async () => {
    budgetService.getBudgetByEventId.mockResolvedValue({ eventId: 8, actualCost: '10.00' });

    await budgetController.getBudgetByEventId({ params: { eventId: '8' } }, res, next);

    expect(budgetService.getBudgetByEventId).toHaveBeenCalledWith(8);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ eventId: 8, actualCost: '10.00' });
  });

  test('getBudgetByEventId validates eventId', async () => {
    await budgetController.getBudgetByEventId({ params: { eventId: '0' } }, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });
});
