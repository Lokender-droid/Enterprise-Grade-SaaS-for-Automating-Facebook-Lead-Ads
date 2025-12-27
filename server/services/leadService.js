const logger = require('../utils/logger');
const facebookService = require('./facebookService');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');
const aiScoringService = require('./aiScoringService');
const Lead = require('../models/Lead');
const voiceService = require('./voiceService');
const intelligenceService = require('./intelligenceService');
const profilingService = require('./profilingService');
const revenueService = require('./revenueService');
const automationService = require('./automationService');

const Organization = require('../models/Organization');
const config = require('../config');

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
                accessToken: organization.metaAccessToken
            },
            sendgridApiKey: organization.sendgridApiKey,
            fromEmail: organization.fromEmail,
            name: organization.name,
            ctaLink: config.ctaLink,

            // Advanced AI Keys from Org
            vapi: {
                privateKey: organization.vapiPrivateKey,
                publicKey: organization.vapiPublicKey,
                assistantId: organization.vapiAssistantId
            },
            openaiApiKey: organization.openaiApiKey
        };

        // 1. Fetch from Facebook using Org Token
        const leadData = await facebookService.fetchLead(leadId, orgConfig.metaAccessToken);

        // 1.5 Calculate Lead Score (AI) - Passing Org Config for Keys
        const scoreResult = await aiScoringService.calculateLeadScore(leadData, orgConfig);

        // 2. Save Initial Lead with Org ID
        let lead = new Lead({
            ...leadData,
            organizationId: organization._id,
            leadScore: scoreResult.score,
            scoreReason: scoreResult.reason
        });
        await lead.save();

        // --- ADVANCED AI AGENTS ---
        await triggerAdvancedFeatures(lead, orgConfig);
        // --------------------------

        // Notify Admin UI 
        if (io) io.emit('new_lead', lead);

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

const triggerAdvancedFeatures = async (lead, orgConfig) => {
    try {
        // 1. Spy Bot & Profiling (Sequential to avoid VersionError)
        await intelligenceService.generateBattlecard(lead, orgConfig);
        await profilingService.predictDISCProfile(lead, orgConfig);
        await revenueService.predictRevenueValue(lead); // Revenue likely doesn't need API keys if logic is internal

        // 2. Instant Voice Agent
        if (lead.phone) {
            voiceService.triggerInstantCall(lead, orgConfig).catch(e => logger.error('Voice Call Error', e));
        }

        // 3. Trigger Omni-channel Swarm Workflows
        automationService.triggerWorkflows('lead_created', lead).catch(e => logger.error('Workflow Error', e));

    } catch (aiError) {
        logger.error('Advanced AI Features encountered an interruption:', aiError);
    }
};

module.exports = { processNewLead, triggerAdvancedFeatures };
