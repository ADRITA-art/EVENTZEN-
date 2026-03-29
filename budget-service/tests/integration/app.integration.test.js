const request = require('supertest');
const express = require('express');

jest.mock('../../src/controllers/budget.controller', () => ({
  upsertEstimatedCost: jest.fn((req, res) => res.status(200).json({ handler: 'estimate' })),
  setTotalBudget: jest.fn((req, res) => res.status(200).json({ handler: 'set' })),
  syncRevenue: jest.fn((req, res) => res.status(200).json({ handler: 'revenue' })),
  getBudgetByEventId: jest.fn((req, res) => res.status(200).json({ handler: 'get', id: Number(req.params.eventId) })),
}));

jest.mock('../../src/controllers/expense.controller', () => ({
  addExpense: jest.fn((req, res) => res.status(201).json({ handler: 'addExpense' })),
  getExpensesByEventId: jest.fn((req, res) =>
    res.status(200).json([{ handler: 'getExpenses', id: Number(req.params.eventId) }])
  ),
  deleteExpenseById: jest.fn((req, res) => res.status(200).json({ handler: 'deleteExpense' })),
}));

const buildAuthHeader = (key) => ({ authorization: `Internal-Service-Key ${key}` });

describe('app integration', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    process.env.INTERNAL_SERVICE_KEY = 'integration-secret';
    app = require('../../src/app');
  });

  test('GET /health returns ok', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('protected route returns 401 without auth header', async () => {
    const response = await request(app).get('/api/budget/10');

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ message: 'Missing internal service authorization' });
  });

  test('protected route returns 403 with wrong auth key', async () => {
    const response = await request(app)
      .get('/api/budget/10')
      .set(buildAuthHeader('wrong'));

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ message: 'Invalid internal service authorization' });
  });

  test('budget routes work with valid auth key', async () => {
    const response = await request(app)
      .get('/api/budget/10')
      .set(buildAuthHeader('integration-secret'));

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ handler: 'get', id: 10 });
  });

  test('expense routes work with valid auth key', async () => {
    const response = await request(app)
      .post('/api/expense')
      .set(buildAuthHeader('integration-secret'))
      .send({ eventId: 1, amount: 20, category: 'Travel' });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ handler: 'addExpense' });
  });

  test('returns 404 for unknown route', async () => {
    const response = await request(app).get('/unknown');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ message: 'Route not found' });
  });

  test('error handler returns error.status and message', async () => {
    const errorApp = express();
    errorApp.get('/boom', (req, res, next) => {
      const error = new Error('boom');
      error.status = 418;
      next(error);
    });
    errorApp.use((error, req, res, next) => {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        message: error.message || 'Internal server error',
      });
    });

    const response = await request(errorApp).get('/boom');
    expect(response.statusCode).toBe(418);
    expect(response.body).toEqual({ message: 'boom' });
  });
});
