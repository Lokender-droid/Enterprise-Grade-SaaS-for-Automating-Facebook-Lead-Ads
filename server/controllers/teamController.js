const Invitation = require('../models/Invitation');
const Admin = require('../models/Admin');
const crypto = require('crypto');
// We would import emailService here to send the actual email
const { sendResetEmail } = require('../services/emailService'); // Reusing for now, or create new function

// POST /api/team/invite
exports.inviteMember = async (req, res) => {
    const { email, role } = req.body;

    try {
        // 1. Check if user already exists
        const userExists = await Admin.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists in the system.' });
        }

        // 2. Check if invite already exists
        const existingInvite = await Invitation.findOne({ email });
        if (existingInvite) {
            return res.status(400).json({ message: 'Invitation already sent to this email.' });
        }

        // 3. Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // 4. Create Invitation
        const invitation = await Invitation.create({
            email,
            organizationId: req.user.organizationId,
            role,
            token,
            expiresAt,
            invitedBy: req.user._id
        });

        // 5. Send Email (Mocking for now, or using a generic sender)
        // In production, create a dedicated sendInvitationEmail function
        const inviteLink = `http://localhost:5173/signup?token=${token}`;
        console.log(`[MOCK EMAIL] Invite Link: ${inviteLink}`);

        // TODO: Implement actual email sending
        // await sendInvitationEmail(email, inviteLink);

        res.status(201).json({
            message: 'Invitation sent successfully',
            invitation
        });

    } catch (error) {
        console.error('Invite Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/team/invitations
exports.getInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({ organizationId: req.user.organizationId });
        res.json(invitations);
    } catch (error) {
        console.error('Get Invitations Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/team/invitation/:token (Public)
exports.getInvitationByToken = async (req, res) => {
    try {
        const invitation = await Invitation.findOne({
            token: req.params.token,
            expiresAt: { $gt: Date.now() }
        }).populate('organizationId', 'name');

        if (!invitation) {
            return res.status(404).json({ message: 'Invalid or expired invitation' });
        }

        res.json({
            email: invitation.email,
            organizationName: invitation.organizationId.name,
            role: invitation.role
        });

    } catch (error) {
        console.error('Get Invitation Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/team/invitation/:id
exports.revokeInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id);

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        if (invitation.organizationId.toString() !== req.user.organizationId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await invitation.deleteOne();
        res.json({ message: 'Invitation revoked' });

    } catch (error) {
        console.error('Revoke Invitation Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};
