const Organization = require('../models/Organization');

// GET /api/organization/settings
exports.getSettings = async (req, res) => {
    try {
        console.log('getSettings Controller called for user:', req.user._id, 'OrgID:', req.user.organizationId);
        // Check if user has an organization
        if (!req.user.organizationId) {
            // If super-admin or user without org, return empty structure or specific message
            // For Settings page, we can just return empty strings so UI doesn't crash
            return res.json({
                name: '',
                email: req.user.email || '',
                pageId: '',
                whatsappPhoneId: '',
                logo: '',
                metaAccessToken: '',
                sendgridApiKey: '',
                fromEmail: ''
            });
        }

        const org = await Organization.findById(req.user.organizationId);
        if (!org) {
            console.log('Organization not found for ID:', req.user.organizationId);
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Return details but mask sensitive keys for security UI display
        // or return them if needed for editing (usually we mask parts)
        res.json({
            name: org.name,
            email: org.email,
            pageId: org.pageId,
            whatsappPhoneId: org.whatsappPhoneId,
            logo: org.logo,
            // Masking secrets for security best practices
            metaAccessToken: org.metaAccessToken ? '****************' : '',
            sendgridApiKey: org.sendgridApiKey ? '****************' : '',
            fromEmail: org.fromEmail
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/organization/settings
exports.updateSettings = async (req, res) => {
    try {
        const {
            name,
            pageId,
            whatsappPhoneId,
            metaAccessToken,
            sendgridApiKey,
            fromEmail,
            deleteLogo
        } = req.body;

        const org = await Organization.findById(req.user.organizationId);
        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Update fields if provided (allow empty string for name)
        if (name !== undefined) org.name = name;
        if (pageId) org.pageId = pageId;
        if (whatsappPhoneId) org.whatsappPhoneId = whatsappPhoneId;
        if (fromEmail) org.fromEmail = fromEmail;

        // Only update secrets if they are not the masked version
        if (metaAccessToken && !metaAccessToken.includes('****')) {
            org.metaAccessToken = metaAccessToken;
        }
        if (sendgridApiKey && !sendgridApiKey.includes('****')) {
            org.sendgridApiKey = sendgridApiKey;
        }

        // Handle Logo Upload
        if (req.file) {
            // Delete old logo if exists (optional cleanup)
            // if (org.logo) { ... delete old file ... }
            org.logo = '/uploads/' + req.file.filename;
        } else if (deleteLogo === 'true' || deleteLogo === true) {
            org.logo = undefined;
        }

        await org.save();

        // Log Activity
        const { logActivity } = require('../services/activityLogger');
        await logActivity(req, 'UPDATE_SETTINGS', req.body, 'Organization', req.user.organizationId);

        res.json({ message: 'Settings updated successfully', org });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/organization/verify-connection
exports.verifyConnection = async (req, res) => {
    try {
        const org = await Organization.findById(req.user.organizationId);
        if (!org || !org.metaAccessToken) {
            return res.status(400).json({ message: 'No Meta Access Token found. Please save settings first.' });
        }

        // Test Meta API
        // Using axios directly here to keep it simple, or reuse facebookService if refactored
        const axios = require('axios');
        try {
            const response = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${org.metaAccessToken}`);
            res.json({
                success: true,
                message: 'Connection Successful!',
                data: response.data
            });
        } catch (error) {
            console.error('Meta Verification Failed:', error.response?.data || error.message);
            res.status(400).json({
                message: 'Connection Failed',
                details: error.response?.data?.error?.message || error.message
            });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.autoConfigureWebhooks = async (req, res) => {
    try {
        const org = await Organization.findById(req.user.organizationId);
        if (!org || !org.metaAccessToken || !org.pageId) {
            return res.status(400).json({ message: 'Missing Meta configuration (Page ID or Access Token)' });
        }

        const facebookService = require('../services/facebookService');
        await facebookService.subscribeAppToPage(org.pageId, org.metaAccessToken);

        res.json({ success: true, message: 'App successfully subscribed to Page webhooks' });

    } catch (error) {
        console.error('Auto-Configure Failed:', error);
        res.status(500).json({
            message: 'Failed to configure webhooks',
            details: error.response?.data?.error?.message || error.message
        });
    }
};
