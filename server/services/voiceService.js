const axios = require('axios');
const config = require('../config');
const Lead = require('../models/Lead');

const VAPI_BASE_URL = 'https://api.vapi.ai';

// Placeholder Assistant ID - This should ideally be in config or passed dynamically
// You would create an assistant in Vapi dashboard and put the ID here
const DEFAULT_ASSISTANT_ID = 'your-vapi-assistant-id';

exports.triggerInstantCall = async (lead, orgConfig) => {
    try {
        // orgConfig is the whole Organization document
        const privateKey = orgConfig.vapiPrivateKey || config.vapi.privateKey;
        const assistantId = orgConfig.vapiAssistantId || DEFAULT_ASSISTANT_ID;
        const fromNumber = orgConfig.vapiPhoneNumber || "+1234567890"; // Def to placeholder if missing

        if (!privateKey) {
            console.warn('⚠️ Vapi API Key missing in Org Settings. Skipping Voice Call.');
            return { success: false, error: 'Missing API Key' };
        }

        if (!lead.phone) {
            console.warn('⚠️ Lead has no phone number. Skipping Voice Call.');
            return { success: false, error: 'Missing Phone' };
        }

        console.log(`📞 Initiating Vapi Call to ${lead.phone} from ${fromNumber}...`);

        const payload = {
            phoneNumber: {
                twilioPhoneNumber: fromNumber,
                customerPhoneNumber: lead.phone
            },
            assistantId: assistantId,
            customer: {
                number: lead.phone,
                name: lead.name
            },
            assistantOverrides: {
                firstMessage: `Hi ${lead.name.split(' ')[0]}, I noticed you just inquired about our services. Do you have a minute?`
            }
        };

        const response = await axios.post(`${VAPI_BASE_URL}/call/phone`, payload, {
            headers: {
                'Authorization': `Bearer ${privateKey}`,
                'Content-Type': 'application/json'
            }
        });

        // Update Lead Status
        lead.voiceCallStatus = 'triggered';
        lead.callId = response.data.id;
        await lead.save();

        return { success: true, callId: response.data.id };

    } catch (error) {
        console.error('❌ Vapi Call Failed:', error.response?.data || error.message);
        lead.voiceCallStatus = 'failed';
        await lead.save();
        return { success: false, error: error.message };
    }
};

exports.handleVoiceWebhook = async (payload) => {
    // Vapi sends webhooks for call-status-update and end-of-call-report
    try {
        const { message } = payload;

        if (message.type === 'end-of-call-report') {
            const callId = message.call.id;
            const lead = await Lead.findOne({ callId });

            if (lead) {
                lead.voiceCallStatus = 'completed';
                lead.callTranscript = message.transcript;
                lead.callRecordingUrl = message.recordingUrl;
                lead.save();
                console.log(`✅ Call Report Processed for Lead: ${lead.name}`);
            }
        }
    } catch (error) {
        console.error('Error processing Voice Webhook:', error);
    }
};
