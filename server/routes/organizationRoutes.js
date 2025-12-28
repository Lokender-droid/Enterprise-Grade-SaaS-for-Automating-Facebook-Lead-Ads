const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/authController');
const organizationController = require('../controllers/organizationController');
const upload = require('../middleware/upload');

router.get('/settings', protect, (req, res, next) => {
    console.log('Route hit: GET /settings');
    next();
}, organizationController.getSettings);
router.put('/settings', protect, upload.single('logo'), organizationController.updateSettings);

// These might be for generic access if needed, but keeping consistent with above
router.get('/', protect, organizationController.getSettings);
router.put('/', protect, organizationController.updateSettings);

router.post('/verify-connection', organizationController.verifyConnection);
router.post('/auto-configure', protect, organizationController.autoConfigureWebhooks); // Protect this!

// White-Labeling Routes
router.post('/verify-domain', protect, organizationController.verifyCustomDomain);
router.get('/dns-instructions', protect, organizationController.getDNSInstructions);
router.delete('/custom-domain', protect, organizationController.removeCustomDomain);

module.exports = router;
