const config = require('../config');
const OpenAI = require('openai');

const openai = config.openaiApiKey && !config.openaiApiKey.includes('placeholder')
    ? new OpenAI({ apiKey: config.openaiApiKey })
    : null;

/**
 * calculateLeadScore
 * Analyzes lead data to assign a "Win Probability" (0-100).
 * Uses OpenAI if available, otherwise falls back to a strong heuristic system.
 */
exports.calculateLeadScore = async (lead) => {
    try {
        // 1. Check if OpenAI Key is present for Real AI Analysis
        if (config.openaiApiKey && !config.openaiApiKey.includes('placeholder')) {
            return await analyzeWithOpenAI(lead);
        } else {
            // 2. Fallback to Heuristic (Rule-based) Scoring
            return analyzeWithHeuristics(lead);
        }
    } catch (error) {
        console.error('AI Scoring Failed:', error);
        return { score: 10, reason: 'AI Analysis failed, minimal score assigned.' };
    }
};

// --- REAL AI ANALYSIS ---
async function analyzeWithOpenAI(lead) {
    const prompt = `
    Analyze this sales lead for a B2B application and assign a "Win Probability Score"(0 - 100).
    be critical.
    
    Lead Data:
Name: ${lead.name}
Email: ${lead.email}
Phone: ${lead.phone}
Source: Facebook Lead Form
    Raw Data: ${JSON.stringify(lead.raw || {})}

    Factors to consider:
- Corporate emails(non - gmail / yahoo) are better.
    - Completeness of data.
    - If valid phone number.

    Return JSON strictly: { "score": number, "reason": "short explanation" }
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        });

        const content = response.choices[0].message.content;
        const result = JSON.parse(content);
        return result;

    } catch (err) {
        console.error('OpenAI Error:', err);
        return analyzeWithHeuristics(lead); // Fallback
    }
}

// --- HEURISTIC ANALYSIS (SIMULATION) ---
function analyzeWithHeuristics(lead) {
    let score = 30; // Base Score
    let reasons = [];

    // 1. Email Analysis
    const email = lead.email ? lead.email.toLowerCase() : '';
    if (email) {
        if (email.includes('gmail') || email.includes('yahoo') || email.includes('hotmail')) {
            score += 10;
            reasons.push('Valid personal email');
        } else {
            score += 40; // Corporate email check (rough)
            reasons.push('High value corporate email domain');
        }
    } else {
        score -= 10;
        reasons.push('Missing email');
    }

    // 2. Phone Analysis
    if (lead.phone && lead.phone.length > 8) {
        score += 20;
        reasons.push('Valid phone number provided');
    }

    // 3. Name Analysis
    if (lead.name && lead.name.split(' ').length > 1) {
        score += 10;
        reasons.push('Full name provided');
    }

    return {
        score: Math.min(score, 99),
        reason: reasons.join('. ') || 'Standard lead entry'
    };
}
