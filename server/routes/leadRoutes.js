const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { protect } = require('../controllers/authController');

// Temporary Seed Route (Must be before /:id)
router.get('/seed', leadController.createTestLead);

router.get('/', protect, leadController.getLeads);
router.post('/', protect, leadController.createLead);
router.get('/:id', protect, leadController.getLeadById);
router.get('/:id/logs', protect, leadController.getLeadLogs);
router.post('/:id/retry-email', leadController.retryEmail);
router.post('/:id/retry-whatsapp', leadController.retryWhatsapp);
router.put('/:id/status', leadController.updateLeadStatus);
router.put('/:id/assign', protect, leadController.assignLead);
router.delete('/:id', protect, leadController.deleteLead);
router.post('/delete-batch', protect, leadController.deleteLeads);

// Temporary Seed Route
router.get('/seed', leadController.createTestLead);

module.exports = router;
