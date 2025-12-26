const Lead = require('../models/Lead');
const Log = require('../models/Log');
const leadService = require('../services/leadService');

// GET /leads
// GET /leads
exports.getLeads = async (req, res) => {
    try {
        const { status, dateFrom, dateTo, search } = req.query;
        let query = { organizationId: req.user.organizationId }; // Enforce Org Isolation

        // RBAC: If Sales, only see assigned leads
        if (req.user.role === 'sales') {
            query.assignedTo = req.user.id;
        }

        // Filter by Date
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        // Filter by Status
        if (status) {
            query.$or = [
                { 'status.email': status },
                { 'status.whatsapp': status },
                { status: status } // Also filter by main status
            ];
        }

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const leads = await Lead.find(query)
            .populate('assignedTo', 'name email') // Show who it is assigned to
            .sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        console.error('Get Leads Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// POST /leads (Manual Create)
exports.createLead = async (req, res) => {
    try {
        const { name, email, phone, status, source, fb_lead_id, form_id } = req.body;

        // SUPER ADMIN FALLBACK: Use first organization if none in token
        let orgId = req.user.organizationId;
        if (!orgId && req.user.role === 'super_admin') {
            const Organization = require('../models/Organization');
            const firstOrg = await Organization.findOne();
            if (firstOrg) orgId = firstOrg._id;
        }

        if (!orgId) {
            return res.status(400).json({ message: 'Organization ID is required (and none found for fallback).' });
        }

        const newLead = await Lead.create({
            fb_lead_id: fb_lead_id || 'manual_' + Date.now(),
            form_id: form_id || 'manual_form',
            name,
            email,
            phone,
            status: status || 'New',
            source: source || 'Manual',
            emailStatus: 'pending',
            whatsappStatus: 'pending',
            organizationId: orgId,
            history: [{ action: 'Created Manually', performedBy: req.user.name }]
        });

        // ⚡ TRIGGER AUTOMATION
        const { triggerWorkflows } = require('../services/automationService');
        // Fire and forget catch
        triggerWorkflows('lead_created', newLead).catch(err => console.error('Automation Error:', err));

        res.status(201).json(newLead);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /leads/:id
exports.getLeadById = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (lead) res.json(lead);
        else res.status(404).json({ message: 'Lead not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /leads/:id/logs
exports.getLeadLogs = async (req, res) => {
    try {
        const logs = await Log.find({ leadId: req.params.id }).sort({ timestamp: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// POST /leads/:id/retry-email
exports.retryEmail = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).send('Lead not found');

        // Logic reused from service mostly, but just email specific
        // We'll call service again or specific method? 
        // For simplicity, let's call the service logic OR just the email part
        // The service does both, so let's just trigger processNewLead again? 
        // No, that fetches FB again. We need specific retry.

        // Re-importing services here might be circular if not careful, but it's fine
        const emailService = require('../services/emailService');
        const logger = require('../utils/logger');

        try {
            await emailService.sendWelcomeEmail(lead);
            lead.status.email = 'sent';
            await logger.dbLog(lead._id, 'email', 'sent');
            await lead.save();
            req.io.emit('update_lead', lead);
            res.json({ message: 'Email retried successfully', lead });
        } catch (err) {
            lead.status.email = 'failed';
            await logger.dbLog(lead._id, 'email', 'failed', { error: err.message });
            await lead.save();
            req.io.emit('update_lead', lead);
            res.status(500).json({ message: 'Retry failed', error: err.message });
        }

    } catch (error) {
        res.status(500).send(error.message);
    }
};

// POST /leads/:id/retry-whatsapp
exports.retryWhatsapp = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).send('Lead not found');

        const whatsappService = require('../services/whatsappService');
        const logger = require('../utils/logger');

        try {
            await whatsappService.sendTemplate(lead);
            lead.status.whatsapp = 'sent';
            await logger.dbLog(lead._id, 'whatsapp', 'sent');
            await lead.save();
            req.io.emit('update_lead', lead);
            res.json({ message: 'WhatsApp retried successfully', lead });
        } catch (err) {
            lead.status.whatsapp = 'failed';
            await logger.dbLog(lead._id, 'whatsapp', 'failed', { error: err.message });
            await lead.save();
            req.io.emit('update_lead', lead);
            res.status(500).json({ message: 'Retry failed', error: err.message });
        }

    } catch (error) {
        res.status(500).send(error.message);
    }
};

// PUT /leads/:id/status
exports.updateLeadStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        lead.status = status;
        await lead.save();

        res.json(lead);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /leads/:id/assign
exports.assignLead = async (req, res) => {
    try {
        const { assignedTo } = req.body; // User ID
        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        lead.assignedTo = assignedTo;
        await lead.save();

        // populated for frontend return
        await lead.populate('assignedTo', 'name');

        req.io.emit('update_lead', lead); // Realtime update
        res.json(lead);
    } catch (error) {
        console.error('Assign Lead Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /leads/seed
exports.createTestLead = async (req, res) => {
    try {
        const newLead = await Lead.create({
            fb_lead_id: 'test_' + Date.now(),
            name: 'Lokender Singh',
            email: 'slokender05@gmail.com',
            phone: '+919817102009',
            form_id: 'test_form_123',
            status: 'New',
            emailStatus: 'sent',
            whatsappStatus: 'pending',
            organizationId: req.user.organizationId,
            history: [{ action: 'Created', performedBy: req.user.name }]
        });

        // ⚡ TRIGGER AUTOMATION
        const { triggerWorkflows } = require('../services/automationService');
        // Fire and forget (don't await, let it run in background)
        triggerWorkflows('lead_created', newLead).catch(err => console.error('Automation Error:', err));

        res.status(201).json(newLead);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /leads/:id
exports.deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        // Delete associated logs
        await Log.deleteMany({ leadId: lead._id });

        // Delete the lead
        await Lead.findByIdAndDelete(req.params.id);

        // Notify clients
        if (req.io) {
            req.io.emit('delete_lead', req.params.id);
        }

        res.json({ message: 'Lead deleted' });
    } catch (error) {
        console.error('Delete Lead Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /leads/delete-batch
exports.deleteLeads = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        // Delete logs for these leads
        await Log.deleteMany({ leadId: { $in: ids } });

        // Delete leads
        await Lead.deleteMany({ _id: { $in: ids } });

        // Notify clients (bulk event or just refresh)
        if (req.io) {
            req.io.emit('bulk_delete', ids);
        }

        res.json({ message: `${ids.length} leads deleted successfully` });
    } catch (error) {
        console.error('Bulk Delete Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
