const Organization = require('../models/Organization');

// GET /api/organization/settings
exports.getSettings = async (req, res) => {
    try {
        console.log('getSettings Controller called for user:', req.user._id, 'OrgID:', req.user.organizationId);
        // Check if user has an organization
        let org;
        if (!req.user.organizationId) {
            // If Super Admin, try to fetch the first organization for Demo purposes
            if (req.user.role === 'super_admin') {
                org = await Organization.findOne();
            }

            if (!org) {
                return res.json({
                    name: '',
                    email: req.user.email || '',
                    // ... defaults
                });
            }
        } else {
            org = await Organization.findById(req.user.organizationId);
        }

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
            fromEmail: org.fromEmail,

            // Advanced AI Keys (Masked)
            vapiPrivateKey: org.vapiPrivateKey ? '****************' : '',
            vapiPublicKey: org.vapiPublicKey ? '****************' : '',
            vapiAssistantId: org.vapiAssistantId ? '****************' : '',
            vapiPhoneNumber: org.vapiPhoneNumber || '',
            openaiApiKey: org.openaiApiKey ? '****************' : '',

            // Enterprise
            customDomain: org.customDomain || '',
            customRoles: org.customRoles || [],
            ssoSettings: org.ssoSettings || { provider: 'none', enabled: false },
            integrations: org.integrations || { salesforce: { connected: false }, hubspot: { connected: false } }
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
            deleteLogo,
            // AI Keys
            vapiPrivateKey,
            vapiPublicKey,
            vapiAssistantId,
            vapiPhoneNumber,
            openaiApiKey,

            // Enterprise
            customDomain,
            customRoles,
            ssoSettings,
            integrations
        } = req.body;

        let org;
        if (!req.user.organizationId) {
            if (req.user.role === 'super_admin') {
                org = await Organization.findOne();

                // Auto-create Demo Org if missing (Self-healing)
                if (!org) {
                    console.log("Auto-creating Default Organization for Super Admin");
                    org = await Organization.create({
                        name: 'MetaLead Demo Enterprise',
                        email: 'admin@metalead.com',
                        plan: 'enterprise',
                        isActive: true
                    });
                }
            }
        } else {
            org = await Organization.findById(req.user.organizationId);
        }

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

        // Update AI Keys
        // Update AI Keys
        if (vapiPrivateKey !== undefined && !vapiPrivateKey.includes('****')) org.vapiPrivateKey = vapiPrivateKey;
        if (vapiPublicKey !== undefined && !vapiPublicKey.includes('****')) org.vapiPublicKey = vapiPublicKey;
        if (vapiAssistantId !== undefined && !vapiAssistantId.includes('****')) org.vapiAssistantId = vapiAssistantId;
        if (vapiPhoneNumber !== undefined) org.vapiPhoneNumber = vapiPhoneNumber;
        if (openaiApiKey !== undefined && !openaiApiKey.includes('****')) org.openaiApiKey = openaiApiKey;

        // Enterprise Updates
        if (customDomain !== undefined) org.customDomain = customDomain;
        // Basic Role Update (Expects JSON array)
        if (customRoles) {
            try {
                const roles = typeof customRoles === 'string' ? JSON.parse(customRoles) : customRoles;
                org.customRoles = roles;
            } catch (e) {
                console.error("Failed to parse custom roles");
            }
        }

        // Update SSO & Integrations (Direct Object replacement for now, simpler)
        if (ssoSettings) {
            try {
                org.ssoSettings = typeof ssoSettings === 'string' ? JSON.parse(ssoSettings) : ssoSettings;
            } catch (e) { }
        }
        if (integrations) {
            try {
                org.integrations = typeof integrations === 'string' ? JSON.parse(integrations) : integrations;
            } catch (e) { }
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
