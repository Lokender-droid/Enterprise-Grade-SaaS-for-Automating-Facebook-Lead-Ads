const Workflow = require('../models/Workflow');
const { v4: uuidv4 } = require('uuid');

// GET /api/workflows
exports.getWorkflows = async (req, res) => {
    try {
        let query = { organizationId: req.user.organizationId };

        // Super Admin sees all or falls back to first org context? 
        // For simple single-tenant feel, if orgId is missing, maybe show all?
        if (!req.user.organizationId && req.user.role === 'super_admin') {
            query = {}; // Show ALL workflows
        }

        const workflows = await Workflow.find(query)
            .select('name description isActive activeVersionId updatedAt') // explicit selection
            .sort({ updatedAt: -1 });
        res.json(workflows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper to build query based on user role
const getWorkflowQuery = (req, id) => {
    const query = { _id: id };
    if (req.user.role !== 'super_admin') {
        query.organizationId = req.user.organizationId;
    }
    return query;
};

// GET /api/workflows/:id
exports.getWorkflowById = async (req, res) => {
    try {
        const workflow = await Workflow.findOne(getWorkflowQuery(req, req.params.id));

        if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
        res.json(workflow);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ... (createWorkflow handled separately above) ...

// POST /api/workflows
exports.createWorkflow = async (req, res) => {
    try {
        const { name, description } = req.body;

        let organizationId = req.user.organizationId;
        console.log('Create Workflow Debug:', { role: req.user.role, orgId: organizationId });

        // Handle Super Admin (who has no orgId in token)
        if (!organizationId && req.user.role === 'super_admin') {
            const Organization = require('../models/Organization');
            const org = await Organization.findOne(); // grab first org
            console.log('Create Workflow: Super Admin Fallback Org:', org ? org._id : 'NONE FOUND');
            if (org) organizationId = org._id;
        }

        if (!organizationId) {
            console.error('Create Workflow Error: No Organization Found for Context');
            return res.status(400).json({ message: 'Organization ID missing. Cannot create workflow. Please create an Organization first.' });
        }

        const workflow = await Workflow.create({
            organizationId,
            name,
            description,
            draft: { nodes: [], edges: [] } // Empty draft
        });

        res.status(201).json(workflow);
    } catch (error) {
        console.error('Create Workflow Error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// PUT /api/workflows/:id/draft (Save Draft)
exports.saveDraft = async (req, res) => {
    try {
        const { nodes, edges } = req.body;
        const workflow = await Workflow.findOne(getWorkflowQuery(req, req.params.id));

        if (!workflow) return res.status(404).json({ message: 'Workflow not found' });

        workflow.draft = { nodes, edges, updatedAt: Date.now() };
        workflow.updatedAt = Date.now();
        await workflow.save();

        res.json({ message: 'Draft saved', draft: workflow.draft });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/workflows/:id/publish (Commit & Deploy)
exports.publishWorkflow = async (req, res) => {
    try {
        const { message } = req.body; // Commit message
        const workflow = await Workflow.findOne(getWorkflowQuery(req, req.params.id));

        if (!workflow) return res.status(404).json({ message: 'Workflow not found' });

        // Create a new Version Snapshot
        const newVersionId = uuidv4().substring(0, 8); // Short hash-like ID
        const newVersion = {
            versionId: newVersionId,
            nodes: workflow.draft.nodes,
            edges: workflow.draft.edges,
            commitMessage: message || 'Update workflow',
            createdBy: req.user._id,
            createdAt: Date.now()
        };

        // Push to history
        workflow.history.push(newVersion);

        // pointers update
        workflow.activeVersionId = newVersionId;
        workflow.isActive = true;
        workflow.updatedAt = Date.now();

        await workflow.save();

        res.json({
            message: 'Workflow published successfully',
            version: newVersionId,
            activeVersionId: workflow.activeVersionId,
            history: workflow.history
        });

    } catch (error) {
        console.error('Publish Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/workflows/:id/rollback (Revert to Version)
exports.rollbackWorkflow = async (req, res) => {
    try {
        const { versionId } = req.body;
        const workflow = await Workflow.findOne(getWorkflowQuery(req, req.params.id));

        if (!workflow) return res.status(404).json({ message: 'Workflow not found' });

        // Find the version in history
        const targetVersion = workflow.history.find(v => v.versionId === versionId);

        if (!targetVersion) {
            return res.status(404).json({ message: 'Version snapshot not found' });
        }

        // Overwrite Draft with this historical version
        workflow.draft = {
            nodes: targetVersion.nodes,
            edges: targetVersion.edges,
            updatedAt: Date.now()
        };

        await workflow.save();

        res.json({
            message: `Draft reverted to version ${versionId}. Review and publish to make it live.`,
            draft: workflow.draft
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/workflows/:id
exports.deleteWorkflow = async (req, res) => {
    try {
        const workflow = await Workflow.findOneAndDelete(getWorkflowQuery(req, req.params.id));
        if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
        res.json({ message: 'Workflow deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
