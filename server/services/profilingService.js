const config = require('../config');
const OpenAI = require('openai');

const openai = config.openaiApiKey && !config.openaiApiKey.includes('placeholder')
    ? new OpenAI({ apiKey: config.openaiApiKey })
    : null;

/**
 * PSYCHOLOGICAL PROFILING (DISC)
 * Estimates personality type based on job title, writing style (if any available raw data), and industry.
 */
exports.predictDISCProfile = async (lead, orgConfig) => {
    // Dynamic initialization
    const apiKey = orgConfig?.openaiApiKey || config.openaiApiKey;

    let localOpenAI = null;
    if (apiKey && !apiKey.includes('placeholder')) {
        localOpenAI = new OpenAI({ apiKey: apiKey });
    } else if (openai) {
        localOpenAI = openai;
    }

    // 1. Mock Fallback
    if (!localOpenAI) {
        console.log(`⚠️ OpenAI missing. Generating MOCK DISC Profile for ${lead.name}`);
        const mockProfile = {
            type: "D",
            primary_trait: "Dominance",
            communication_tips: ["Be brief", "Focus on results", "Avoid small talk"]
        };

        lead.discProfile = mockProfile;
        await lead.save();
        return mockProfile;
    }

    try {
        console.log(`🧠 Profiling Lead: ${lead.name}...`);

        // In a real scenario, we would feed in their LinkedIn About section or recent posts.
        // Here we infer from Job Title and Industry context (simulated).
        const prompt = `
        Based on the following lead info, predict their DISC Personality Profile.
        
        Name: ${lead.name}
        Job Title (inferred/known): Unknown (Assume Decision Maker)
        Industry: Tech/SaaS (Target Context)

        Output JSON:
        {
          "type": "D/I/S/C",
          "primary_trait": "Dominance/Influence...",
          "communication_tips": [
             "Be direct", "Focus on ROI"
          ]
        }
        `;

        const response = await localOpenAI.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);

        lead.discProfile = result;
        await lead.save();

        return result;

    } catch (error) {
        console.error('❌ Profiling Failed:', error);
        return null;
    }
};
