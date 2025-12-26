const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testRPA() {
    console.log('🚀 Starting RPA Execution Test...');

    try {
        // 1. Login as Admin
        console.log('1. Logging in...');
        const loginRes = await axios.post('http://localhost:4000/auth/login', {
            email: 'admin@example.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('   ✅ Logged in as:', loginRes.data.email);

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Create a Lead
        console.log('2. Creating a New Lead to Trigger Automation...');
        const newLead = {
            name: 'Automation Tester',
            email: 'test_auto@example.com',
            phone: '+1234567890',
            source: 'Test Script',
            fb_lead_id: 'manual_' + Date.now(), // Fake ID for validation
            form_id: 'manual_form'
        };

        const leadRes = await axios.post(`${API_URL}/leads`, newLead, config);
        console.log('   ✅ Lead Created:', leadRes.data._id);

        console.log('\n👀 CHECK YOUR SERVER CONSOLE NOW!');
        console.log('   You should see: "⚡ Automation Trigger: lead_created"');
        console.log('   And if you have a workflow: "✉ SENDING EMAIL to test_auto@example.com"');

    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    }
}

testRPA();
