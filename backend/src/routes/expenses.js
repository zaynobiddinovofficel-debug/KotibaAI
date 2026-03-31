const router = require('express').Router();
const ctrl = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getExpenses);
router.get('/summary', authenticate, ctrl.getSummary);
router.post('/', authenticate, ctrl.createExpense);
router.put('/:id', authenticate, ctrl.updateExpense);
router.delete('/:id', authenticate, ctrl.deleteExpense);

module.exports = router;
