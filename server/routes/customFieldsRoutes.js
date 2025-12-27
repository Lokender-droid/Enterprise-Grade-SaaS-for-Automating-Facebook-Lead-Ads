const express = require('express');
const router = express.Router();
const customFieldsService = require('../services/customFieldsService');

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
router.get('/', ensureAuth, async (req, res) => {
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
router.put('/:id', ensureAuth, async (req, res) => {
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
router.delete('/:id', ensureAuth, async (req, res) => {
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
router.put('/reorder/all', ensureAuth, async (req, res) => {
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
router.put('/leads/:leadId/value', ensureAuth, async (req, res) => {
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
