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

// --- CRM Team Collaboration Routes ---
const teamService = require('../services/teamService');

// Assign lead
router.post('/leads/:leadId/assign', async (req, res) => {
    try {
        const { userId } = req.body;
        const lead = await teamService.assignLead(
            req.user.organizationId,
            req.params.leadId,
            userId,
            req.user._id
        );
        res.json(lead);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Auto-assign lead
router.post('/leads/:leadId/auto-assign', async (req, res) => {
    try {
        const assignee = await teamService.autoAssignLead(
            req.user.organizationId,
            req.params.leadId
        );
        res.json({ assignee });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get team performance
router.get('/performance', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const performance = await teamService.getTeamPerformance(
            req.user.organizationId,
            startDate,
            endDate
        );
        res.json(performance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
