const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/authController');
const { handleAIChat } = require('../controllers/aiController');

router.post('/chat', protect, handleAIChat);

module.exports = router;
