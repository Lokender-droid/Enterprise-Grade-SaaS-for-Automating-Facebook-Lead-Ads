const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const authController = require('../controllers/authController');

// All routes are protected
router.use(authController.protect);

// Get my notifications
router.get('/', async (req, res) => {
    try {
        const notifications = await notificationService.getUserNotifications(
            req.user.organizationId,
            req.user._id
        );
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark one as read
router.put('/:id/read', async (req, res) => {
    try {
        const result = await notificationService.markAsRead(
            req.user.organizationId,
            req.params.id,
            req.user._id
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Mark ALL as read
router.put('/read/all', async (req, res) => {
    try {
        const result = await notificationService.markAllAsRead(
            req.user.organizationId,
            req.user._id
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
