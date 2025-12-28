const express = require('express');
const router = express.Router();
const customFieldsService = require('../services/customFieldsService');

<<<<<<< HEAD
const authController = require('../controllers/authController');

// Create custom field
router.post('/', authController.protect, async (req, res) => {
=======
// Authentication middleware placeholder
// In real app: const auth = require('../middleware/auth');
// For now assuming req.user or req.organizationId is set by upstream middleware
const ensureAuth = (req, res, next) => {
    // Mock for now, replace with actual auth
    // req.user = { _id: 'admin_id', organizationId: 'org_id' };
    next();
};

// Create custom field
router.post('/', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    try {
        const field = await customFieldsService.createCustomField(
            req.user.organizationId,
            req.body,
            req.user._id
        );
        res.status(201).json(field);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all custom fields
<<<<<<< HEAD
router.get('/', authController.protect, async (req, res) => {
=======
router.get('/', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    try {
        const fields = await customFieldsService.getCustomFields(
            req.user.organizationId,
            req.query
        );
        res.json(fields);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update custom field
<<<<<<< HEAD
router.put('/:id', authController.protect, async (req, res) => {
=======
router.put('/:id', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    try {
        const field = await customFieldsService.updateCustomField(
            req.user.organizationId,
            req.params.id,
            req.body,
            req.user._id
        );
        res.json(field);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete custom field
<<<<<<< HEAD
router.delete('/:id', authController.protect, async (req, res) => {
=======
router.delete('/:id', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    try {
        const result = await customFieldsService.deleteCustomField(
            req.user.organizationId,
            req.params.id,
            req.user._id
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Reorder fields
<<<<<<< HEAD
router.put('/reorder/all', authController.protect, async (req, res) => {
=======
router.put('/reorder/all', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    try {
        // req.body.orders = [{ fieldId, displayOrder }]
        const result = await customFieldsService.reorderFields(
            req.user.organizationId,
            req.body.orders
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Set lead field value
<<<<<<< HEAD
router.put('/leads/:leadId/value', authController.protect, async (req, res) => {
=======
router.put('/leads/:leadId/value', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    try {
        const { fieldKey, value } = req.body;
        const lead = await customFieldsService.setLeadFieldValue(
            req.params.leadId,
            fieldKey,
            value,
            req.user.organizationId
        );
        res.json(lead);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
