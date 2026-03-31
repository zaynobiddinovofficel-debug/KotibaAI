const router = require('express').Router();
const ctrl = require('../controllers/pushController');
const { authenticate } = require('../middleware/auth');

router.get('/vapid-key', ctrl.getVapidKey);
router.post('/subscribe', authenticate, ctrl.subscribe);
router.post('/unsubscribe', authenticate, ctrl.unsubscribe);
router.post('/test', authenticate, ctrl.testPush);

module.exports = router;
