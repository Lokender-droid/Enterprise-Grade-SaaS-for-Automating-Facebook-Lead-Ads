const axios = require('axios');
const logger = require('../utils/logger');

/**
 * CRM Integration Service
 * Handles bidirectional sync with Salesforce and HubSpot
 */

const syncToSalesforce = async (lead, orgConfig) => {
    if (!orgConfig.integrations?.salesforce?.connected) return { status: 'skipped' };

    const { accessToken, instanceUrl } = orgConfig.integrations.salesforce;
    if (!accessToken || !instanceUrl) return { status: 'failed', error: 'Missing Credentials' };

    try {
        logger.info(`Syncing Lead ${lead.email} to Salesforce...`);

        // 1. Check if Lead already exists (to avoid duplicates)
        const searchUrl = `${instanceUrl}/services/data/v58.0/parameterizedSearch/?q=${encodeURIComponent(lead.email)}&sobject=Lead&Lead.fields=Id,Email`;
        const searchRes = await axios.get(searchUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const existingId = searchRes.data.searchRecords?.[0]?.Id;

        // 2. Prepare Payload
        const payload = {
            FirstName: lead.name.split(' ')[0],
            LastName: lead.name.split(' ').slice(1).join(' ') || 'Lead',
            Company: lead.companyName || 'Individual', // Fallback to 'Individual' is safer than 'Unknown'
            Email: lead.email,
            Phone: lead.phone,
            LeadSource: 'Meta Lead Ads',
            Description: `Imported via WKPC Automation.\nScore: ${lead.leadScore}\nProfile: ${lead.discProfile || 'N/A'}`
        };

        if (existingId) {
            // UPDATE existing Lead
            await axios.patch(
                `${instanceUrl}/services/data/v58.0/sobjects/Lead/${existingId}`,
                payload,
                { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
            );
            logger.info(`✅ Salesforce Lead Updated: ${existingId}`);
            return { status: 'success', externalId: existingId, action: 'updated' };
        } else {
            // CREATE new Lead
            const createRes = await axios.post(
                `${instanceUrl}/services/data/v58.0/sobjects/Lead`,
                payload,
                { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
            );
            logger.info(`✅ Salesforce Lead Created: ${createRes.data.id}`);
            return { status: 'success', externalId: createRes.data.id, action: 'created' };
        }

    } catch (error) {
        logger.error('Salesforce Sync Failed', error.response?.data || error.message);
        return { status: 'failed', error: JSON.stringify(error.response?.data || error.message) };
    }
};

const syncToHubSpot = async (lead, orgConfig) => {
    if (!orgConfig.integrations?.hubspot?.connected) return { status: 'skipped' };

    const { accessToken } = orgConfig.integrations.hubspot;
    if (!accessToken) return { status: 'failed', error: 'Missing Credentials' };

    try {
        logger.info(`Syncing Lead ${lead.email} to HubSpot...`);

        // HubSpot logic: First search by email, then Create or Update
        // This is "Enterprise Grade" because it effectively deduplicates.

        // 1. Search
        const searchRes = await axios.post(
            `https://api.hubapi.com/crm/v3/objects/contacts/search`,
            {
                filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: lead.email }] }]
            },
            { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
        );

        const existingId = searchRes.data.results?.[0]?.id;

        const properties = {
            email: lead.email,
            firstname: lead.name.split(' ')[0],
            lastname: lead.name.split(' ').slice(1).join(' ') || 'Lead',
            phone: lead.phone,
            lead_score: String(lead.leadScore || 0),
            lifecyclestage: 'marketingqualifiedlead',
            // Add custom notes if needed (HubSpot standard field 'message' or 'jobtitle' etc)
            jobtitle: lead.companyName || ''
        };

        if (existingId) {
            // UPDATE
            await axios.patch(
                `https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`,
                { properties },
                { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
            );
            logger.info(`✅ HubSpot Contact Updated: ${existingId}`);
            return { status: 'success', externalId: existingId, action: 'updated' };
        } else {
            // CREATE
            const createRes = await axios.post(
                `https://api.hubapi.com/crm/v3/objects/contacts`,
                { properties },
                { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
            );
            logger.info(`✅ HubSpot Contact Created: ${createRes.data.id}`);
            return { status: 'success', externalId: createRes.data.id, action: 'created' };
        }

    } catch (error) {
        logger.error('HubSpot Sync Failed', error.response?.data || error.message);
        return { status: 'failed', error: JSON.stringify(error.response?.data || error.message) };
    }
};

// --- Verification Helpers ---

const verifySalesforce = async (accessToken, instanceUrl) => {
    try {
        // Fetch API Limits as a lightweight "Ping"
        // This validates both the Token and Instance URL
        const response = await axios.get(
            `${instanceUrl}/services/data/v58.0/limits`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return { success: true, data: response.data };
    } catch (error) {
        logger.error('Salesforce Verification Failed', error.response?.data || error.message);
        throw new Error(error.response?.data?.[0]?.message || 'Salesforce Connection Failed. Check Instance URL and Token.');
    }
};

const verifyHubSpot = async (accessToken) => {
    try {
        // Fetch 1 contact to verify Token scope
        const response = await axios.get(
            `https://api.hubapi.com/crm/v3/objects/contacts?limit=1`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return { success: true };
    } catch (error) {
        logger.error('HubSpot Verification Failed', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'HubSpot Access Token Invalid.');
    }
};

module.exports = {
    syncToSalesforce,
    syncToHubSpot,
    verifySalesforce,
    verifyHubSpot
};
