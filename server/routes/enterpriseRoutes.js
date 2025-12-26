const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/authController');
const { getAuditLogs, getNotifications, markAsRead } = require('../controllers/enterpriseController');

// All routes protected
router.use(protect);

router.get('/audit-logs', getAuditLogs);
router.get('/notifications', getNotifications);
router.put('/notifications/read', markAsRead);

module.exports = router;
