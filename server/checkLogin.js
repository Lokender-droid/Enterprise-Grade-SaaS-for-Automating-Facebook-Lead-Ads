const axios = require('axios');

const login = async () => {
    try {
        console.log('Attempting login for admin@example.com...');
        const res = await axios.post('http://localhost:4000/auth/login', {
            email: 'admin@example.com',
            password: 'admin123'
        });
        console.log('Login Success!');
        console.log('Token:', res.data.token ? 'Received' : 'Missing');
        console.log('User:', res.data.name);
    } catch (err) {
        console.error('Login Failed!');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
};

login();
