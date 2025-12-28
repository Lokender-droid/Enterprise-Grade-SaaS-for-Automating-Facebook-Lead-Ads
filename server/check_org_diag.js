const mongoose = require('mongoose');
const config = require('./config.js');
const Organization = require('./models/Organization');
const User = require('./models/User'); // Or Admin model? The code references 'users' mostly.
const Admin = require('./models/Admin'); // Let's check both

async function checkOrg() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to DB');

        const orgs = await Organization.find();
        console.log(`Found ${orgs.length} organizations.`);
        if (orgs.length > 0) {
            console.log('First Org:', JSON.stringify(orgs[0], null, 2));
        }

        const admins = await Admin.find();
        console.log(`Found ${admins.length} admins.`);
        admins.forEach(u => {
            console.log(`Admin: ${u.email}, Role: ${u.role}, OrgId: ${u.organizationId}`);
        });

        // Also check Users collection if separate
        // const users = await User.find();
        // console.log(`Found ${users.length} users (team members).`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkOrg();
