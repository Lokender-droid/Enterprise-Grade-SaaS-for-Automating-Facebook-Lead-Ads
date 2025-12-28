const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Workflow = require('../models/Workflow');
const WorkflowJob = require('../models/WorkflowJob');
const Lead = require('../models/Lead');
const Organization = require('../models/Organization');
const workflowEngine = require('../services/workflowEngine');

const runTest = async () => {
    try {
        console.log('--- CONNECTING TO DB ---');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/enterprise_lead_saas', { serverSelectionTimeoutMS: 5000 });
        console.log('--- CONNECTED ---');

        // 1. Setup Context (Org)
        const org = await Organization.findOne();
        if (!org) throw new Error('No Organization found. Please seed DB first.');
        console.log('Context Organization:', org.name);

        // CLEAR OLD EXPERIMENTS
        await Workflow.deleteMany({ organizationId: org._id });
        await WorkflowJob.deleteMany({ organizationId: org._id });
        console.log('--- CLEARED OLD DATA ---');

        // 2. Create Complex Workflow (Start -> Condition -> True/False)
        // High Priority Lead -> WhatsApp
        // Low Priority Lead -> Email
        const versionId = 'vtest_' + Date.now();
        const nodes = [
            { id: 'start', type: 'trigger', data: { label: 'New Lead' } },

            // Condition: Email contains tesla
            { id: 'cond_1', type: 'condition', data: { label: 'Is VIP?', config: { field: 'email', operator: 'contains', value: 'tesla' } } },

            // True Branch: WhatsApp
            {
                id: 'act_vip', type: 'action', data: {
                    label: 'VIP WhatsApp',
                    subType: 'whatsapp',
                    config: { message: 'URGENT VIP LEAD: {{lead.name}} - Call now!' }
                }
            },

            // False Branch: Email
            {
                id: 'act_std', type: 'action', data: {
                    label: 'Std Email',
                    subType: 'email',
                    config: { subject: 'Welcome', body: 'Hi {{lead.name}}, thanks for joining.' }
                }
            }
        ];

        const edges = [
            { id: 'e1', source: 'start', target: 'cond_1' },
            { id: 'e2', source: 'cond_1', target: 'act_vip', sourceHandle: 'true' }, // True Path
            { id: 'e3', source: 'cond_1', target: 'act_std', sourceHandle: 'false' }  // False Path
        ];

        const workflow = await Workflow.create({
            organizationId: org._id,
            name: 'Advanced Logic Test Bot',
            isActive: true,
            activeVersionId: versionId,
            history: [{ versionId, nodes, edges, commitMessage: 'Test Version' }],
            draft: { nodes, edges }
        });
        console.log('--- WORKFLOW CREATED ---', workflow._id);

        // 3. Simulate Lead 1 (VIP)
        const leadVIP = await Lead.create({
            organizationId: org._id,
            name: 'Elon Musk',
            email: 'elon@tesla.com',
            priority: 'High', // Should trigger True path
            status: 'New',
            fb_lead_id: 'test_vip_' + Date.now()
        });
        console.log('--- VIP LEAD CREATED ---', leadVIP.name);

        // 4. Trigger & Process VIP
        console.log('>>> TRIGGERING ENGINE (VIP) <<<');
        await workflowEngine.trigger('lead_created', { lead: leadVIP, organizationId: org._id });

        // Wait for async processing...
        await new Promise(r => setTimeout(r, 3000));

        // 5. Verify VIP Job
        const jobVIP = await WorkflowJob.findOne({ leadId: leadVIP._id, workflowId: workflow._id });
        console.log('\n--- VERIFYING VIP JOB ---');
        console.log('Status:', jobVIP?.status);
        if (jobVIP) {
            jobVIP.logs.forEach(l => console.log(`[${l.timestamp.toISOString()}] ${l.message}`));

            // CHECK: Did it go to VIP WhatsApp?
            const vipHit = jobVIP.logs.find(l => l.message && l.message.includes('WhatsApp sent'));
            if (vipHit && vipHit.metadata.message.includes('URGENT VIP LEAD: Elon Musk')) {
                console.log('✅ SUCCESS: VIP Path taken & Variable {{lead.name}} substituted!');
            } else {
                console.error('❌ FAILED: VIP Path not taken correctly.');
            }
        } else {
            console.error('❌ FAILED: Job not created.');
        }

        // 6. Simulate Lead 2 (Standard)
        const leadStd = await Lead.create({
            organizationId: org._id,
            name: 'John Doe',
            email: 'john@example.com',
            priority: 'Low', // Should trigger False path
            status: 'New',
            fb_lead_id: 'test_std_' + Date.now()
        });
        console.log('\n--- STD LEAD CREATED ---', leadStd.name);

        // 7. Trigger & Process Standard
        console.log('>>> TRIGGERING ENGINE (STD) <<<');
        await workflowEngine.trigger('lead_created', { lead: leadStd, organizationId: org._id });

        // Wait...
        await new Promise(r => setTimeout(r, 3000));

        // 8. Verify Standard Job
        const jobStd = await WorkflowJob.findOne({ leadId: leadStd._id, workflowId: workflow._id });
        console.log('\n--- VERIFYING STD JOB ---');
        console.log('Status:', jobStd?.status);
        if (jobStd) {
            jobStd.logs.forEach(l => console.log(`[${l.timestamp.toISOString()}] ${l.message}`));

            // CHECK: Did it go to Std Email?
            const stdHit = jobStd.logs.find(l => l.message && l.message.includes('Email sent'));
            if (stdHit) {
                console.log('✅ SUCCESS: Standard Path taken!');
            } else {
                console.error('❌ FAILED: Standard Path not taken.');
            }
        }

        console.log('\nDONE.');
        process.exit(0);
    } catch (e) {
        console.error('TEST FAILED:', e);
        process.exit(1);
    }
};

runTest();
