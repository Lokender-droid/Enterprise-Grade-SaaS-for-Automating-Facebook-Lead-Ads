const Organization = require('../models/Organization');
const axios = require('axios');
const config = require('../config');
<<<<<<< HEAD
const ActivityLog = require('../models/ActivityLog');
const domainService = require('../services/domainService');
=======
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19

// Get Organization Settings
exports.getSettings = async (req, res) => {
    try {
        console.log('getSettings called for user:', req.user);

        // Handle super-admin or users without organizationId
        let org;
        if (req.user.organizationId) {
            org = await Organization.findById(req.user.organizationId);
        } else {
            // For super-admin or demo users, get first organization
            org = await Organization.findOne();
        }

        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Mask sensitive keys before sending
        const safeOrg = org.toObject();
        if (safeOrg.metaAccessToken) safeOrg.metaAccessToken = '****';
        if (safeOrg.sendgridApiKey) safeOrg.sendgridApiKey = '****';
        if (safeOrg.vapiPrivateKey) safeOrg.vapiPrivateKey = '****';
        if (safeOrg.vapiPublicKey) safeOrg.vapiPublicKey = '****';
        if (safeOrg.openaiApiKey) safeOrg.openaiApiKey = '****';

        // Mask OAuth secrets
        if (safeOrg.ssoSettings) {
            if (safeOrg.ssoSettings.googleClientSecret) safeOrg.ssoSettings.googleClientSecret = '****';
            if (safeOrg.ssoSettings.microsoftClientSecret) safeOrg.ssoSettings.microsoftClientSecret = '****';
        }

        res.json(safeOrg);
    } catch (error) {
        console.error('Error in getSettings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Organization Settings
exports.updateSettings = async (req, res) => {
    try {
        const org = await Organization.findById(req.user.organizationId);
        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Handle file upload (logo)
        if (req.file) {
            org.logo = `/uploads/${req.file.filename}`;
        }

        // Update fields
        const fields = [
            'name', 'pageId', 'whatsappPhoneId', 'fromEmail',
            'vapiAssistantId', 'vapiPhoneNumber', 'customDomain'
        ];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                org[field] = req.body[field];
            }
        });

        // Handle secret keys (only update if not masked)
        const secretFields = {
            metaAccessToken: req.body.metaAccessToken,
            sendgridApiKey: req.body.sendgridApiKey,
            vapiPrivateKey: req.body.vapiPrivateKey,
            vapiPublicKey: req.body.vapiPublicKey,
            openaiApiKey: req.body.openaiApiKey
        };

        Object.entries(secretFields).forEach(([key, value]) => {
            if (value && value !== '****') {
                org[key] = value;
            }
        });

        // Handle customRoles (might be JSON string)
        if (req.body.customRoles) {
            org.customRoles = typeof req.body.customRoles === 'string'
                ? JSON.parse(req.body.customRoles)
                : req.body.customRoles;
        }

        // Handle SSO settings
        if (req.body.ssoSettings) {
            org.ssoSettings = typeof req.body.ssoSettings === 'string'
                ? JSON.parse(req.body.ssoSettings)
                : req.body.ssoSettings;
        }

<<<<<<< HEAD
        // Handle integrations (verify credentials if connecting)
        if (req.body.integrations) {
            let updates = typeof req.body.integrations === 'string'
                ? JSON.parse(req.body.integrations)
                : req.body.integrations;

            // Merging logic to ensure we don't overwrite with partial data if needed, 
            // but controller usually receives full object or delta.
            // We need to check if we are *enabling* a connection.

            const integrationService = require('../services/integrationService');

            // 1. Verify Salesforce
            if (updates.salesforce?.connected && updates.salesforce?.accessToken) {
                console.log('🔍 Verifying Salesforce Credentials...');
                await integrationService.verifySalesforce(
                    updates.salesforce.accessToken,
                    updates.salesforce.instanceUrl
                );
                console.log('✅ Salesforce Verified.');
            }

            // 2. Verify HubSpot
            if (updates.hubspot?.connected && updates.hubspot?.accessToken) {
                console.log('🔍 Verifying HubSpot Credentials...');
                await integrationService.verifyHubSpot(updates.hubspot.accessToken);
                console.log('✅ HubSpot Verified.');
            }

            org.integrations = updates;
=======
        // Handle integrations
        if (req.body.integrations) {
            org.integrations = typeof req.body.integrations === 'string'
                ? JSON.parse(req.body.integrations)
                : req.body.integrations;
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
        }

        await org.save();

        // Reconfigure OAuth if SSO settings were updated
        if (req.body.ssoSettings) {
            try {
                const passport = require('../config/passport-setup');
                if (passport.reconfigureOAuth) {
                    await passport.reconfigureOAuth();
                    console.log('✅ OAuth strategies reconfigured with new settings');
                }
            } catch (error) {
                console.error('⚠️  Failed to reconfigure OAuth:', error);
                // Don't fail the entire request if OAuth reconfiguration fails
            }
        }

<<<<<<< HEAD
        // Log Activity
        ActivityLog.create({
            organizationId: req.user.organizationId,
            performedBy: req.user._id,
            userName: req.user.name || req.user.email,
            action: 'UPDATE_SETTINGS',
            entityType: 'Organization',
            entityId: org._id,
            details: { updated: Object.keys(req.body) },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        }).catch(err => console.error('[AUDIT-LOG] Failed:', err));

=======
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Verify Facebook Connection
exports.verifyConnection = async (req, res) => {
    try {
        const org = await Organization.findById(req.user.organizationId);
        if (!org || !org.metaAccessToken || !org.pageId) {
            return res.status(400).json({
                success: false,
                message: 'Missing Page ID or Access Token'
            });
        }

        // Test API call to Facebook
        const response = await axios.get(
            `https://graph.facebook.com/v21.0/${org.pageId}`,
            {
                params: {
                    fields: 'name,access_token',
                    access_token: org.metaAccessToken
                }
            }
        );

        res.json({
            success: true,
            message: 'Connection Successful',
            pageName: response.data.name
        });

    } catch (error) {
        console.error('Verification Failed:', error.response?.data || error.message);
        res.status(400).json({
            success: false,
            message: 'Connection Failed',
            details: error.response?.data?.error?.message || error.message
        });
    }
};

// Auto-configure webhooks
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

// ============================================
// WHITE-LABELING ENDPOINTS
// ============================================
const domainService = require('../services/domainService');

<<<<<<< HEAD
// WHITE-LABEL DOMAIN VERIFICATION
// ============================================

// Verify custom domain
exports.verifyCustomDomain = async (req, res) => {
    try {
        const { customDomain } = req.body;

        if (!customDomain) {
            return res.status(400).json({
                success: false,
                message: 'Custom domain is required'
            });
        }

        // Verify domain with domainService
        const result = await domainService.verifyDomain(
            customDomain,
            req.user.organizationId
        );

        if (result.success) {
            // Log activity
            ActivityLog.create({
                organizationId: req.user.organizationId,
                performedBy: req.user._id,
                userName: req.user.name || req.user.email,
                action: 'VERIFY_CUSTOM_DOMAIN',
                entityType: 'Organization',
                details: { domain: customDomain, status: 'verified' },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
            }).catch(err => console.error('[AUDIT-LOG] Failed:', err));
        }

        res.json(result);
    } catch (error) {
        console.error('Domain verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during verification'
        });
    }
};

// Get DNS setup instructions
exports.getDNSInstructions = async (req, res) => {
    try {
        const { domain } = req.query;

        if (!domain) {
            return res.status(400).json({ message: 'Domain parameter required' });
        }

        const instructions = domainService.getDNSInstructions(domain);
        res.json(instructions);
    } catch (error) {
        console.error('Get DNS instructions error:', error);
=======
exports.verifyCustomDomain = async (req, res) => {
    try {
        const { customDomain } = req.body;
        const organizationId = req.user.organizationId;

        if (!customDomain) {
            return res.status(400).json({ message: 'Custom domain is required' });
        }

        const result = await domainService.verifyDomain(customDomain, organizationId);

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                verified: true
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Verify domain error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDNSInstructions = async (req, res) => {
    try {
        const { customDomain } = req.query;
        const instructions = domainService.getDNSInstructions(customDomain);
        res.json(instructions);
    } catch (error) {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
        res.status(500).json({ message: 'Server error' });
    }
};

<<<<<<< HEAD
// Check DNS propagation status
exports.checkPropagationStatus = async (req, res) => {
    try {
        const { domain } = req.query;

        if (!domain) {
            return res.status(400).json({ message: 'Domain parameter required' });
        }

        const status = await domainService.checkPropagationStatus(domain);
        res.json(status);
    } catch (error) {
        console.error('Check propagation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Remove custom domain
exports.removeCustomDomain = async (req, res) => {
    try {
        const result = await domainService.removeDomain(req.user.organizationId);

        if (result.success) {
            // Log activity
            ActivityLog.create({
                organizationId: req.user.organizationId,
                performedBy: req.user._id,
                userName: req.user.name || req.user.email,
                action: 'REMOVE_CUSTOM_DOMAIN',
                entityType: 'Organization',
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
            }).catch(err => console.error('[AUDIT-LOG] Failed:', err));
        }

        res.json(result);
    } catch (error) {
        console.error('Remove domain error:', error);
=======
exports.removeCustomDomain = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const result = await domainService.removeDomain(organizationId);
        res.json(result);
    } catch (error) {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
        res.status(500).json({ message: 'Server error' });
    }
};
