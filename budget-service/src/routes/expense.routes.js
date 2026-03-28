const express = require('express');
const expenseController = require('../controllers/expense.controller');

const router = express.Router();

router.post('/expense', expenseController.addExpense);
router.get('/expense/event/:eventId', expenseController.getExpensesByEventId);
router.delete('/expense/:id', expenseController.deleteExpenseById);

module.exports = router;
