const axios = require('axios');

const testParams = async () => {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:4000/auth/login', {
            email: 'admin@example.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Got Token:', token ? 'Yes' : 'No');

        if (!token) return;

        // 2. Access Protected Route
        console.log('Accessing Protected Route: /api/organization/settings');
        const protectedRes = await axios.get('http://localhost:4000/api/organization/settings', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Protected Route Success:', protectedRes.status);
        console.log('Data:', protectedRes.data);

    } catch (err) {
        console.error('Test Failed!');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
};

testParams();
