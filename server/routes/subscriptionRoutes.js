const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../controllers/authController');

// Webhook MUST be before body parser processing in main server.js, 
// OR we serve it on a different path /api/webhook/stripe that uses raw body.
// For simplicity in this architecture, let's assume valid middleware setup or generic protect won't block it.
// Actually, webhooks shouldn't be protected by JWT.
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

router.use(protect);
router.post('/create-checkout-session', subscriptionController.createCheckoutSession);
router.post('/create-portal-session', subscriptionController.createPortalSession);

module.exports = router;
