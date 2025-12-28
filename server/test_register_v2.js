const axios = require('axios');

async function testRegister() {
    try {
        console.log("Testing validation error (expecting 400)...");
        await axios.post('http://localhost:4000/auth/register', {
            // companyName: 'TestOrg_' + Date.now(),
            name: 'TestUser',
            email: 'test' + Date.now() + '@example.com',
            password: 'password123'
        });
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testRegister();
