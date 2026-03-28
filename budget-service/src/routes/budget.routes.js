const express = require('express');
const budgetController = require('../controllers/budget.controller');

const router = express.Router();

router.post('/budget/estimate', budgetController.upsertEstimatedCost);
router.post('/budget/set', budgetController.setTotalBudget);
router.put('/budget/revenue/:eventId', budgetController.syncRevenue);
router.get('/budget/:eventId', budgetController.getBudgetByEventId);

module.exports = router;
