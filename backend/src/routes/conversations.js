const router = require('express').Router();
const ctrl = require('../controllers/conversationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getHistory);
router.delete('/', authenticate, ctrl.clearHistory);

module.exports = router;
