const express = require('express');
const budgetController = require('../controllers/budget.controller');

const router = express.Router();

router.post('/budget', budgetController.createBudget);
router.get('/budget/:eventId', budgetController.getBudgetByEventId);

module.exports = router;
