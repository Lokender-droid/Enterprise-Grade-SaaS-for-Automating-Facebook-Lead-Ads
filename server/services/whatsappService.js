const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

const sendTemplate = async (lead, whatsappConfig) => {
    try {
        const url = `https://graph.facebook.com/v16.0/${whatsappConfig.phoneId}/messages`;

        const data = {
            messaging_product: 'whatsapp',
            to: lead.phone,
            type: 'template',
            template: {
                name: 'lead_thank_you',
                language: { code: 'en_US' },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: lead.name },      // {{1}}
                            { type: 'text', text: config.ctaLink }  // {{2}}
                        ]
                    }
                ]
            }
        };

        const headers = {
            'Authorization': `Bearer ${whatsappConfig.accessToken}`,
            'Content-Type': 'application/json'
        };

        const response = await axios.post(url, data, { headers });
        logger.info(`WhatsApp sent to ${lead.phone}`);
        return { status: 'sent', response: response.data };

    } catch (error) {
        logger.error('WhatsApp Send Error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

module.exports = { sendTemplate };
