require('dotenv').config();
const express = require('express');
const morgan = require('morgan');

const budgetRoutes = require('./routes/budget.routes');
const expenseRoutes = require('./routes/expense.routes');
const { requireInternalServiceKey } = require('./middleware/internalAuth');

const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Budget APIs are internal-only and must not be publicly writable/readable.
app.use('/api', requireInternalServiceKey, budgetRoutes);
app.use('/api', requireInternalServiceKey, expenseRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  res.status(statusCode).json({
    message: error.message || 'Internal server error',
  });
});

module.exports = app;
