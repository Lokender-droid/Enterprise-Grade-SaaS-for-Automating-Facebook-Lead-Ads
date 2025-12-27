const express = require('express');
const router = express.Router();
const pipelineService = require('../services/pipelineService');

const ensureAuth = (req, res, next) => next(); // Placeholder

// Get all pipeline stages
router.get('/stages', ensureAuth, async (req, res) => {
    try {
        const stages = await pipelineService.getStages(req.user.organizationId);
        res.json(stages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create stage
router.post('/stages', ensureAuth, async (req, res) => {
    try {
        const stageData = { ...req.body, organizationId: req.user.organizationId };
        const stage = await pipelineService.createStage(stageData);
        res.status(201).json(stage);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update stage
router.put('/stages/:id', ensureAuth, async (req, res) => {
    try {
        const stage = await pipelineService.updateStage(
            req.user.organizationId,
            req.params.id,
            req.body
        );
        res.json(stage);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Reorder stages
router.put('/stages/reorder/all', ensureAuth, async (req, res) => {
    try {
        const result = await pipelineService.reorderStages(
            req.user.organizationId,
            req.body.orders
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Move lead to stage
router.put('/leads/:leadId/stage', ensureAuth, async (req, res) => {
    try {
        const { stageKey } = req.body;
        const lead = await pipelineService.moveLeadToStage(
            req.user.organizationId,
            req.params.leadId,
            stageKey,
            req.user._id
        );
        res.json(lead);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
