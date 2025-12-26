const mongoose = require('mongoose');

// Schema for a single node in the workflow graph
const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, required: true }, // 'trigger', 'action', 'condition'
    position: {
        x: { type: Number },
        y: { type: Number }
    },
    data: { type: Object } // Custom data (e.g., email content, delay time)
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    type: { type: String, default: 'smoothstep' }
}, { _id: false });

// A snapshot of a workflow at a point in time (A "Commit")
const VersionSchema = new mongoose.Schema({
    versionId: { type: String, required: true }, // e.g., 'v1', 'v2' or UUID
    nodes: [NodeSchema],
    edges: [EdgeSchema],
    commitMessage: { type: String }, // User's description of changes
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { _id: false });

const WorkflowSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: false },

    // "Pointer" to the current live version
    activeVersionId: { type: String },

    // The Working Draft (Head)
    draft: {
        nodes: [NodeSchema],
        edges: [EdgeSchema],
        updatedAt: { type: Date, default: Date.now }
    },

    // History of all commits
    history: [VersionSchema],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Workflow', WorkflowSchema);
