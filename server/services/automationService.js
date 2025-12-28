const Workflow = require('../models/Workflow');
<<<<<<< HEAD
const { sendWelcomeEmail } = require('./emailService');
const whatsappService = require('./whatsappService');
=======
const { sendEmail } = require('./emailService');
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
const voiceService = require('./voiceService');
const intelligenceService = require('./intelligenceService');
const profilingService = require('./profilingService');
const revenueService = require('./revenueService');

// In-memory state for Circuit Breaker
const circuitState = {
    failures: 0,
    isOpen: false,
    nextTry: 0
};

const MAX_FAILURES = 5;
const COOLDOWN_MS = 60000; // 1 minute

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

<<<<<<< HEAD
exports.triggerWorkflows = async (triggerType, data, orgConfig) => {
=======
exports.triggerWorkflows = async (triggerType, data) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    // 0. Circuit Breaker Check
    if (circuitState.isOpen) {
        if (Date.now() < circuitState.nextTry) {
            console.warn('⚠️ Circuit Breaker OPEN. Skipping automation.');
            return;
        }
        // Reset if cooldown passed
        console.log('✅ Circuit Breaker Recovering...');
        circuitState.isOpen = false;
        circuitState.failures = 0;
    }

    console.log(`⚡ Automation Trigger: ${triggerType}`, data._id);
    const workflows = await Workflow.find({ isActive: true });

    for (const w of workflows) {
        let graph = w.draft; // Default to draft for demo
        if (w.activeVersionId) {
            const activeVer = w.history.find(v => v.versionId === w.activeVersionId);
            if (activeVer) graph = activeVer;
        }

        const startNode = graph.nodes.find(n =>
            n.data.nodeType === 'trigger' && n.data.label.includes(triggerType === 'lead_created' ? 'Lead' : 'Unknown')
        );

        if (startNode) {
            console.log(`   ► Starting Workflow: ${w.name}`);
<<<<<<< HEAD
            await executeWorkflow(graph, startNode, data, orgConfig);
=======
            await executeWorkflow(graph, startNode, data);
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
        }
    }
};

<<<<<<< HEAD
async function executeWorkflow(graph, startNode, context, orgConfig) {
=======
async function executeWorkflow(graph, startNode, context) {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    let currentNode = startNode;
    let steps = 0;
    const MAX_STEPS = 50;

    while (currentNode && steps < MAX_STEPS) {
        steps++;
        console.log(`      Running Node: ${currentNode.data.label}`);

        try {
            // RETRY LOGIC with Exponential Backoff
<<<<<<< HEAD
            const resultHandle = await executeWithRetry(currentNode, context, orgConfig);
=======
            const resultHandle = await executeWithRetry(currentNode, context);
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19

            // Reset Circuit on success
            circuitState.failures = 0;

            // Move Next
            const edges = graph.edges.filter(e => e.source === currentNode.id);
            if (edges.length === 0) break;

            let nextEdge;
            // Branching Logic
            if (resultHandle && typeof resultHandle === 'string') {
                nextEdge = edges.find(e => e.sourceHandle === resultHandle);
                if (!nextEdge) {
                    // Fallback to default if not specific handle found (or if resultHandle was void)
                    nextEdge = edges[0];
                }
            } else {
                nextEdge = edges[0];
            }

            if (!nextEdge) break;

            currentNode = graph.nodes.find(n => n.id === nextEdge.target);

        } catch (err) {
            console.error(`      ☠ Node Execution Failed: ${err.message}`);

            // Circuit Breaker Config
            circuitState.failures++;
            if (circuitState.failures >= MAX_FAILURES) {
                console.error('      💥 Circuit Breaker TRIPPED! Pausing all automations.');
                circuitState.isOpen = true;
                circuitState.nextTry = Date.now() + COOLDOWN_MS;
            }
            break;
        }
    }
}

<<<<<<< HEAD
async function executeWithRetry(node, context, orgConfig, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await processNode(node, context, orgConfig);
=======
async function executeWithRetry(node, context, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await processNode(node, context);
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
        } catch (err) {
            const isLastAttempt = i === retries - 1;
            console.warn(`         ⚠️ Attempt ${i + 1} failed. ${isLastAttempt ? 'Giving up.' : 'Retrying...'}`);
            if (isLastAttempt) throw err;
            await delay(1000 * Math.pow(2, i)); // 1s, 2s, 4s
        }
    }
}

<<<<<<< HEAD
async function processNode(node, context, orgConfig) {
=======
async function processNode(node, context) {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    const { nodeType, subType, config } = node.data;

    // Simulate Failure for testing if configured
    if (config?.forceFail) throw new Error("Simulated Failure");

    // 1. ACTION: EMAIL
    if (nodeType === 'action' && subType === 'email') {
        if (!config?.subject) throw new Error("Missing Email Subject");

        const subject = config.subject.replace('{name}', context.name || 'User');
<<<<<<< HEAD
        const bodyOverride = config.body; // TODO: Pass this to emailService if supported

        console.log(`         ✉ SENDING REAL EMAIL to ${context.email} (Subj: ${subject})`);

        // Use Real Email Service
        // NOTE: sendWelcomeEmail currently uses hardcoded template. 
        // We might want to extend it later to support custom body from 'config.body'
        await sendWelcomeEmail(context, orgConfig);

        // Wait minor delay to be nice to API limits
=======
        console.log(`         ✉ SENDING EMAIL to ${context.email} (Subj: ${subject})`);
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
        await delay(300);
    }

    // 2. ACTION: WHATSAPP
    if (nodeType === 'action' && subType === 'whatsapp') {
<<<<<<< HEAD
        console.log(`         💬 SENDING REAL WHATSAPP to ${context.phone}...`);

        if (orgConfig.whatsapp && orgConfig.whatsapp.phoneId && orgConfig.whatsapp.accessToken) {
            await whatsappService.sendTemplate(context, orgConfig.whatsapp);
        } else {
            console.warn('         ⚠️ WhatsApp Config missing. Skipping.');
        }
=======
        console.log(`         💬 SENDING WHATSAPP...`);
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
        await delay(300);
    }

    // 3. ACTION: INSTANT VOICE CALL
    if (nodeType === 'action' && subType === 'voice_call') {
<<<<<<< HEAD
        console.log(`         📞 TRIGGERING REAL VOICE AGENT...`);
        await voiceService.triggerInstantCall(context, orgConfig);
=======
        console.log(`         📞 STARTING VOICE AGENT...`);
        await voiceService.triggerInstantCall(context);
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    }

    // 4. ACTION: INTELLIGENCE AGENT (SPY BOT)
    if (nodeType === 'action' && (subType === 'spy_bot' || subType === 'competitor_analysis')) {
        console.log(`         🕵️ RUNNING SPY BOT...`);
<<<<<<< HEAD
        await intelligenceService.generateBattlecard(context, orgConfig);
=======
        await intelligenceService.generateBattlecard(context);
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    }

    // 5. ACTION: PROFILING AGENT (DISC)
    if (nodeType === 'action' && subType === 'disc_profile') {
        console.log(`         🧠 ANALYZING PSYCHOLOGY...`);
<<<<<<< HEAD
        await profilingService.predictDISCProfile(context, orgConfig);
=======
        await profilingService.predictDISCProfile(context);
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    }

    // 6. ACTION: REVENUE PREDICTION
    if (nodeType === 'action' && subType === 'revenue_prediction') {
        console.log(`         💰 PREDICTING REVENUE...`);
        await revenueService.predictRevenueValue(context);
    }

    // 7. CONDITION
    if (nodeType === 'condition') {
        const { field, operator, value } = config;
        let conditionMet = false;
        let actualValue = context[field];

        if (operator === '>') conditionMet = actualValue > value;
        if (operator === '<') conditionMet = actualValue < value;
        if (operator === '=') conditionMet = actualValue == value;

        console.log(`         ❓ CONDITION: ${field}(${actualValue}) ${operator} ${value} ? => ${conditionMet}`);
        return conditionMet ? 'true' : 'false';
    }
<<<<<<< HEAD

    // 8. WAIT
    if (nodeType === 'wait') {
        const duration = parseInt(config.duration || 1);
        const unit = config.unit || 'minutes';
        // In real world, we would schedule a job (BullMQ/Agenda).
        // Since this is a simple 'while loop' runner, we can only safely wait for few seconds.
        // For long waits, this architecture needs a 'Pause/Resume' system.
        // For now, we simulate strictly small delays or skip.
        if (unit === 'minutes' && duration > 5) {
            console.warn('         ⚠️ Long wait skipped in synchronous runner.');
        } else {
            const ms = unit === 'minutes' ? duration * 60000 : duration * 1000;
            console.log(`         ⏳ Waiting ${duration} ${unit}...`);
            if (ms < 10000) await delay(ms); // Only wait up to 10s synchronously
        }
    }
}

=======
}
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
