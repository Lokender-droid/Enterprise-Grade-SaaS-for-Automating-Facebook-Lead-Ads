const Workflow = require('../models/Workflow');
const { sendEmail } = require('./emailService');
// We will need a new emailService or modify existing one to send generic emails.
// For now assuming we can require it or use a placeholder.

/**
 * Automation Engine
 * Traverses the workflow graph and executes nodes.
 */

/**
 * Automation Engine with Circuit Breaker & Retry Logic
 */

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
            await executeWithRetry(currentNode, context);

            // Reset Circuit on success
            circuitState.failures = 0;

            // Move Next
            const edges = graph.edges.filter(e => e.source === currentNode.id);
            if (edges.length === 0) break;

            // TODO: Fallback Logic check if previous execution failed (not implemented yet for individual paths)
            currentNode = graph.nodes.find(n => n.id === edges[0].target);

        } catch (err) {
            console.error(`      ☠ Node Execution Failed: ${err.message}`);

            // Circuit Breaker Config
            circuitState.failures++;
            if (circuitState.failures >= MAX_FAILURES) {
                console.error('      💥 Circuit Breaker TRIPPED! Pausing all automations.');
                circuitState.isOpen = true;
                circuitState.nextTry = Date.now() + COOLDOWN_MS;
            }

            // FALLBACK PATH
            // In a real graph, we would look for an edge with handle="failure"
            // For now, we simulate a robust exit.
            break;
        }
    }
}

async function executeWithRetry(node, context, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await processNode(node, context);
            return; // Success
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
        if (!config?.subject) throw new Error("Missing Email Subject"); // Will trigger retry

        const subject = config.subject.replace('{name}', context.name || 'User');
        console.log(`         ✉ SENDING EMAIL to ${context.email} (Subj: ${subject})`);
        await delay(300);
    }

    // 2. ACTION: WHATSAPP
    if (nodeType === 'action' && subType === 'whatsapp') {
        console.log(`         💬 SENDING WHATSAPP...`);
        await delay(300);
    }

    // 4. CONDITION
    if (nodeType === 'condition') {
        const { field, operator, value } = config;

        // Evaluate
        let conditionMet = false;
        let actualValue = context[field];

        // Hacky evaluation for demo numbers/strings
        // In prod, use a safer eval or math library
        if (operator === '>') conditionMet = actualValue > value;
        if (operator === '<') conditionMet = actualValue < value;
        if (operator === '=') conditionMet = actualValue == value;

        console.log(`         ❓ CONDITION: ${field}(${actualValue}) ${operator} ${value} ? => ${conditionMet}`);

        // Return the Handle ID to follow
        return conditionMet ? 'true' : 'false';
    }
}

async function executeWorkflow(graph, startNode, context) {
    let currentNode = startNode;
    let steps = 0;
    const MAX_STEPS = 50;

    while (currentNode && steps < MAX_STEPS) {
        steps++;
        console.log(`      Running Node: ${currentNode.data.label}`);

        try {
            // EXECUTE current node logic
            // If it returns a string, it's a specific path (handleId)
            const resultHandle = await executeWithRetry(currentNode, context);

            // Reset Circuit on success
            circuitState.failures = 0;

            // Move Next
            const edges = graph.edges.filter(e => e.source === currentNode.id);
            if (edges.length === 0) break;

            let nextEdge;
            // Branching Logic
            if (resultHandle) {
                // Find edge connected to the specific sourceHandle (true/false)
                nextEdge = edges.find(e => e.sourceHandle === resultHandle);
                if (!nextEdge) {
                    console.log(`         🚫 No path found for result: ${resultHandle}`);
                    break;
                }
            } else {
                // Default behavior (single output)
                nextEdge = edges[0];
            }

            currentNode = graph.nodes.find(n => n.id === nextEdge.target);

        } catch (err) {
            console.error(`      ☠ Node Execution Failed: ${err.message}`);
            // ... (Circuit Breaker Logic same as before)
            break;
        }
    }
}
