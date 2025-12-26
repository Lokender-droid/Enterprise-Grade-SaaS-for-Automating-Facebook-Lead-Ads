const logger = require('../utils/logger');
const facebookService = require('./facebookService');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');
const aiScoringService = require('./aiScoringService');
const Lead = require('../models/Lead');

const Organization = require('../models/Organization');

const processNewLead = async (leadId, pageId, io) => {
    logger.info(`Processing new lead: ${leadId} for Page: ${pageId}`);

    try {
        // 0. Find Organization
        const organization = await Organization.findOne({ pageId: pageId });

        if (!organization) {
            logger.error(`No Organization found for Page ID: ${pageId}`);
            return;
        }

        const orgConfig = {
            metaAccessToken: organization.metaAccessToken,
            whatsapp: {
                phoneId: organization.whatsappPhoneId,
                accessToken: organization.metaAccessToken // Assuming same token for now
            },
            sendgridApiKey: organization.sendgridApiKey,
            fromEmail: organization.fromEmail,
            name: organization.name,
            ctaLink: config.ctaLink // Or org specific link
        };

        // 1. Fetch from Facebook using Org Token
        const leadData = await facebookService.fetchLead(leadId, orgConfig.metaAccessToken);

        // 1.5 Calculate Lead Score (AI)
        const scoreResult = await aiScoringService.calculateLeadScore(leadData);

        // 2. Save Initial Lead with Org ID
        let lead = new Lead({
            ...leadData,
            organizationId: organization._id,
            leadScore: scoreResult.score,
            scoreReason: scoreResult.reason
        });
        await lead.save();

        // Notify Admin UI (Room based emission would be better for multi-tenant)
        // io.to(organization._id).emit('new_lead', lead); <-- Future optimization
        if (io) io.emit('new_lead', lead); // Currently emits to everyone (MVP limitation)

        // 3. Send Email
        try {
            if (lead.email) {
                await emailService.sendWelcomeEmail(lead, orgConfig);
                lead.status.email = 'sent';
                await logger.dbLog(lead._id, 'email', 'sent');
            }
        } catch (err) {
            lead.status.email = 'failed';
            await logger.dbLog(lead._id, 'email', 'failed', { error: err.message });
        }

        // 4. Send WhatsApp
        try {
            if (lead.phone) {
                await whatsappService.sendTemplate(lead, orgConfig.whatsapp);
                lead.status.whatsapp = 'sent';
                await logger.dbLog(lead._id, 'whatsapp', 'sent');
            }
        } catch (err) {
            lead.status.whatsapp = 'failed';
            await logger.dbLog(lead._id, 'whatsapp', 'failed', { error: err.message });
        }

        // Save final status
        await lead.save();

        // Update Admin UI
        if (io) io.emit('update_lead', lead);

    } catch (err) {
        logger.error(`Failed to process lead ${leadId}`, err);
    }
};

module.exports = { processNewLead };
