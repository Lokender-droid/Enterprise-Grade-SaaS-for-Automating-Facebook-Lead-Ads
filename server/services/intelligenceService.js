const config = require('../config');
const OpenAI = require('openai');

const openai = config.openaiApiKey && !config.openaiApiKey.includes('placeholder')
    ? new OpenAI({ apiKey: config.openaiApiKey })
    : null;

/**
 * Generates a "Sales Battlecard" by analyzing the lead's company and potential competitors.
 * In a full production version, this would use Puppeteer to scrape the lead's website and competitor websites.
 * Here, we use OpenAI's knowledge base to simulate this analysis.
 */
exports.generateBattlecard = async (lead, orgConfig) => {
    // Dynamic initialization or use global fallback
    const apiKey = orgConfig?.openaiApiKey || config.openaiApiKey;

    // Create a local instance if key provided, else use global if exists
    let localOpenAI = null;
    if (apiKey && !apiKey.includes('placeholder')) {
        localOpenAI = new OpenAI({ apiKey: apiKey });
    } else if (openai) {
        localOpenAI = openai; // Global fallback
    }

    // 1. Mock Fallback if no OpenAI Key (for testing)
    if (!localOpenAI) {
        console.warn('⚠️ OpenAI Key missing. Using Mock Intelligence Data.');

        const mockData = {
            company_summary: "Inferred Tech Company based on email domain.",
            competitors: [
                { name: "Competitor A", website: "comp-a.com", weakness: "High pricing, legacy UI" },
                { name: "Competitor B", website: "comp-b.com", weakness: "Lack of mobile app" }
            ],
            battlecard_markdown: "## Battlecard (Mock)\n- **Win Strategy**: Highlight our AI features.\n- **Counterpoint**: They lack predictive scoring."
        };

        // Update Lead
        lead.companyInfo = {
            summary: mockData.company_summary,
            website: lead.email.split('@')[1]
        };
        lead.competitors = mockData.competitors;
        lead.salesBattlecard = mockData.battlecard_markdown;
        await lead.save();

        return mockData;
    }

    try {
        const domain = lead.email.split('@')[1];
        if (['gmail.com', 'yahoo.com', 'hotmail.com'].includes(domain)) {
            console.log('Skipping intelligence for public email provider.');
            return null;
        }

        console.log(`🕵️ Generating Intel for domain: ${domain}...`);

        const prompt = `
        You are a Top-Tier Sales Intelligence Agent.
        
        Target Company Domain: ${domain}
        Lead Name: ${lead.name}

        Tasks:
        1. Identify the industry and what this company likely does.
        2. Identify 3 likely COMPTITORS for this company in their market.
        3. Create a "Sales Battlecard" for my sales rep to sell OUR SaaS product (B2B Lead Automation & AI Agents) to THEM.
        
        Output format (JSON):
        {
          "company_summary": "Short description...",
          "competitors": [
            { "name": "Comp1", "website": "comp1.com", "weakness": "..." },
            { "name": "Comp2", "website": "comp2.com", "weakness": "..." }
          ],
          "battlecard_markdown": "## How to Win...\n- Point 1\n- Point 2..."
        }
        `;

        const response = await localOpenAI.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: "You are a sales intelligence bot." }, { role: "user", content: prompt }],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);

        // Update Lead
        lead.companyInfo = {
            summary: result.company_summary,
            website: domain
        };
        lead.competitors = result.competitors;
        lead.salesBattlecard = result.battlecard_markdown;

        await lead.save();
        console.log(`✅ Battlecard Generated for ${domain}`);
        return result;

    } catch (error) {
        console.error('❌ Intelligence Service Failed:', error);
        return null;
    }
};
