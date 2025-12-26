const OpenAI = require('openai');
const Lead = require('../models/Lead');
const config = require('../config');

// Initialize OpenAI if key exists
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

exports.handleAIChat = async (req, res) => {
    try {
        const { message } = req.body;
        const organizationId = req.user.organizationId;
        // 0. Check Subscription Plan (Feature Gating)
        const Organization = require('../models/Organization');
        const org = await Organization.findById(organizationId);

        if (!org) {
            console.log('Organization not found for AI chat');
        }

        // 1. Fetch Context Data (Recent Leads Summary)

        const leads = await Lead.find({ organizationId }).sort({ createdAt: -1 }).limit(100);

        const summary = {
            total: leads.length,
            new: leads.filter(l => l.status === 'New').length,
            contacted: leads.filter(l => l.status === 'Contacted').length,
            converted: leads.filter(l => l.status === 'Converted').length,
            lastLead: leads[0] ? leads[0].name : 'None'
        };

        // --- DEMO MODE (If no OpenAI Key) ---
        if (!openai) {
            console.log('AI Chat: Using Demo Mode (Missing Key)');
            const lowerMsg = message.toLowerCase();

            let responseText = "I'm running in Demo AI Mode. Connect an OpenAI Key for full intelligence!";

            // Sub-note: If you want to differentiate, you can, but core feature is now unlocked.
            // if (org.plan === 'free') { ... }

            if (lowerMsg.includes('how many') || lowerMsg.includes('count') || lowerMsg.includes('total')) {
                responseText = `You have ${summary.total} total leads recently.`;
            } else if (lowerMsg.includes('new') || lowerMsg.includes('fresh')) {
                responseText = `You have ${summary.new} new leads waiting for action.`;
            } else if (lowerMsg.includes('convert') || lowerMsg.includes('sale')) {
                responseText = `You have converted ${summary.converted} leads so far. Great job!`;
            } else if (lowerMsg.includes('last') || lowerMsg.includes('recent')) {
                responseText = `The most recent lead is ${summary.lastLead}.`;
            } else {
                responseText = `I can tell you about your leads. Try asking "How many new leads?" or "Who is the last lead?". (Demo Mode)`;
            }

            // Simulate "thinking" delay
            await new Promise(r => setTimeout(r, 1000));
            return res.json({ reply: responseText });
        }

        // --- REAL AI MODE ---
        // Create a prompt with data context
        const prompt = `
            You are an expert Data Analyst for a business.
            Here is the current data summary for the user:
            - Total Leads (Last 100): ${summary.total}
            - New: ${summary.new}
            - Contacted: ${summary.contacted}
            - Converted: ${summary.converted}
            - Most Recent Lead Name: ${summary.lastLead}
            
            User Question: "${message}"
            
            Answer the user in a helpful, professional, and concise way. If the answer isn't in the data, say you can only see recent activity.
        `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful analytics assistant." }, { role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
        });

        const reply = completion.choices[0].message.content;
        return res.json({ reply });

    } catch (error) {
        console.error('AI Chat Error:', error);
        return res.status(500).json({ message: 'AI Brain overload. Please try again.' });
    }
};
