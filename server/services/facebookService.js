const axios = require('axios');
const config = require('../config');
// const logger = require('../utils/logger'); // Assuming logger might not be used or can be simple console for now

exports.fetchLead = async (leadId, accessToken) => {
    try {
        const url = `https://graph.facebook.com/v18.0/${leadId}?access_token=${accessToken}`;
        const response = await axios.get(url);
        const data = response.data;

        // Normalize Data
        let email = '';
        let phone = '';
        let full_name = '';

        if (data.field_data) {
            data.field_data.forEach(field => {
                if (field.name === 'email') email = field.values[0];
                if (field.name === 'phone_number') phone = field.values[0];
                if (field.name === 'full_name') full_name = field.values[0];
            });
        }

        return {
            fb_lead_id: data.id,
            page_id: config.facebook?.pageId,
            form_id: data.form_id,
            name: full_name || 'Valued Lead',
            email: email,
            phone: phone,
            raw: data
        };
    } catch (error) {
        console.error('Error fetching lead from Facebook:', error.response ? error.response.data : error.message);
        throw error;
    }
};

exports.subscribeAppToPage = async (pageId, accessToken) => {
    try {
        const url = `https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`;
        const response = await axios.post(url, null, {
            params: {
                subscribed_fields: 'leadgen',
                access_token: accessToken
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error subscribing app to page:', error.response ? error.response.data : error.message);
        throw error;
    }
};
