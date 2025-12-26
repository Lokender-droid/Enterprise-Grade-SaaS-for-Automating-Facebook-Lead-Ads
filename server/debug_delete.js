const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testDelete() {
    console.log('🚀 Debugging Delete Route...');

    try {
        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await axios.post('http://localhost:4000/auth/login', {
            email: 'admin@example.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('   ✅ Logged in');

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Create Dummy Workflow
        console.log('2. Creating Dummy Workflow...');
        const createRes = await axios.post(`${API_URL}/workflows`, {
            name: 'ToDelete ' + Date.now(),
            description: 'Temporary'
        }, config);
        const wfId = createRes.data._id;
        console.log('   ✅ Created Workflow:', wfId);

        // 3. Try to DELETE
        console.log(`3. Attempting DELETE /api/workflows/${wfId}...`);
        try {
            await axios.delete(`${API_URL}/workflows/${wfId}`, config);
            console.log('   ✅ DELETE SUCCESS! Route is working.');
        } catch (delErr) {
            console.error('   ❌ DELETE FAILED!');
            console.error('   Status:', delErr.response ? delErr.response.status : 'Unknown');
            console.error('   Message:', delErr.response ? delErr.response.data : delErr.message);

            if (delErr.response && delErr.response.status === 404) {
                console.log('\n💡 DIAGNOSIS: 404 means the Route does not exist on the running server.');
                console.log('   Likely Fix: RESTART THE SERVER.');
            }
        }

    } catch (error) {
        console.error('❌ Setup Failed:', error.message);
    }
}

testDelete();
