const router = require('express').Router();
const ctrl = require('../controllers/assistantController');
const { authenticate } = require('../middleware/auth');

router.post('/respond', authenticate, ctrl.respond);

module.exports = router;
