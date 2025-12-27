const Workflow = require('../models/Workflow');
const { sendEmail } = require('./emailService');
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

exports.triggerWorkflows = async (triggerType, data) => {
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
            await executeWorkflow(graph, startNode, data);
        }
    }
};

async function executeWorkflow(graph, startNode, context) {
    let currentNode = startNode;
    let steps = 0;
    const MAX_STEPS = 50;

    while (currentNode && steps < MAX_STEPS) {
        steps++;
        console.log(`      Running Node: ${currentNode.data.label}`);

        try {
            // RETRY LOGIC with Exponential Backoff
            const resultHandle = await executeWithRetry(currentNode, context);

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

async function executeWithRetry(node, context, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await processNode(node, context);
        } catch (err) {
            const isLastAttempt = i === retries - 1;
            console.warn(`         ⚠️ Attempt ${i + 1} failed. ${isLastAttempt ? 'Giving up.' : 'Retrying...'}`);
            if (isLastAttempt) throw err;
            await delay(1000 * Math.pow(2, i)); // 1s, 2s, 4s
        }
    }
}

async function processNode(node, context) {
    const { nodeType, subType, config } = node.data;

    // Simulate Failure for testing if configured
    if (config?.forceFail) throw new Error("Simulated Failure");

    // 1. ACTION: EMAIL
    if (nodeType === 'action' && subType === 'email') {
        if (!config?.subject) throw new Error("Missing Email Subject");

        const subject = config.subject.replace('{name}', context.name || 'User');
        console.log(`         ✉ SENDING EMAIL to ${context.email} (Subj: ${subject})`);
        await delay(300);
    }

    // 2. ACTION: WHATSAPP
    if (nodeType === 'action' && subType === 'whatsapp') {
        console.log(`         💬 SENDING WHATSAPP...`);
        await delay(300);
    }

    // 3. ACTION: INSTANT VOICE CALL
    if (nodeType === 'action' && subType === 'voice_call') {
        console.log(`         📞 STARTING VOICE AGENT...`);
        await voiceService.triggerInstantCall(context);
    }

    // 4. ACTION: INTELLIGENCE AGENT (SPY BOT)
    if (nodeType === 'action' && (subType === 'spy_bot' || subType === 'competitor_analysis')) {
        console.log(`         🕵️ RUNNING SPY BOT...`);
        await intelligenceService.generateBattlecard(context);
    }

    // 5. ACTION: PROFILING AGENT (DISC)
    if (nodeType === 'action' && subType === 'disc_profile') {
        console.log(`         🧠 ANALYZING PSYCHOLOGY...`);
        await profilingService.predictDISCProfile(context);
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
}
