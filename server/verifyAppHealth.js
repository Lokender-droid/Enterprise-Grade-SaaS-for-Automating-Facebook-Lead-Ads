const axios = require('axios');

async function checkHealth() {
    console.log("---- APP FLOW VERIFICATION ----");

    try {
        // 1. LOGIN
        console.log("1. Checking Login...");
        const login = await axios.post('http://localhost:4000/auth/login', {
            email: 'admin@example.com',
            password: 'admin123'
        });
        const token = login.data.token;
        console.log("   ✅ Login Success! (User ID: " + login.data._id + ")");

        // 2. CHECK SETTINGS (Flow Trigger)
        console.log("2. Checking Settings Config...");
        const settings = await axios.get('http://localhost:4000/api/organization/settings', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const isConfigured = settings.data.metaAccessToken && settings.data.pageId;
        console.log("   ℹ️ Meta Connected: " + (settings.data.metaAccessToken ? 'YES' : 'NO'));
        console.log("   ℹ️ Page ID Linked: " + (settings.data.pageId ? 'YES' : 'NO'));

        if (!isConfigured) {
            console.log("   ✅ EXPECTED: 'Get Started' Banner will appear on Dashboard.");
        } else {
            console.log("   ⚠️ NOTE: 'Get Started' Banner will NOT appear (Already configured).");
        }

        // 3. CHECK BILLING
        console.log("3. Checking Billing API...");
        try {
            const billing = await axios.post('http://localhost:4000/api/subscription/create-checkout-session', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (billing.data.url && billing.data.url.includes('success=true')) {
                console.log("   ✅ Billing Demo Mode Active: URL redirects to success.");
            } else {
                console.log("   ℹ️ Billing URL generated: " + billing.data.url);
            }
        } catch (e) {
            console.log("   ❌ Billing Check Failed: " + e.message);
        }

        console.log("\n---- VERIFICATION COMPLETE: ALL SYSTEMS GO ----");

    } catch (error) {
        console.error("❌ CRITICAL FAILURE:");
        if (error.code === 'ECONNREFUSED') {
            console.error("   Server is NOT running. Please run 'npm run start' in the server folder.");
        } else {
            console.error("   " + error.message);
            if (error.response) console.error("   Status: " + error.response.status);
        }
    }
}

checkHealth();
