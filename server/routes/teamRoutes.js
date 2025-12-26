const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { protect } = require('../controllers/authController');

// Public Route
router.get('/join/:token', teamController.getInvitationByToken);

// Protected Routes
router.use(protect);

router.post('/invite', teamController.inviteMember);
router.get('/invitations', teamController.getInvitations);
router.delete('/invitation/:id', teamController.revokeInvitation);

module.exports = router;
