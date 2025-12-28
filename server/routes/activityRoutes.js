const express = require('express');
const router = express.Router();
const activityService = require('../services/activityService');

const authController = require('../controllers/authController');

// Get activity timeline for a lead
router.get('/lead/:leadId', authController.protect, async (req, res) => {
    try {
        const timeline = await activityService.getLeadTimeline(
            req.user.organizationId,
            req.params.leadId,
            req.query
        );
        res.json(timeline);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get recent activities (Dashboard)
router.get('/recent', authController.protect, async (req, res) => {
    try {
        const activities = await activityService.getRecentActivities(
            req.user.organizationId,
            req.query.limit ? parseInt(req.query.limit) : 20
        );
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get activity stats
router.get('/stats', authController.protect, async (req, res) => {
    try {
        const stats = await activityService.getActivityStats(
            req.user.organizationId,
            req.query.startDate,
            req.query.endDate
        );
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
