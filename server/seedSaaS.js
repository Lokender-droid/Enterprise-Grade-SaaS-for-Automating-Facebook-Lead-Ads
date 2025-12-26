require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Organization = require('./models/Organization');
const Admin = require('./models/Admin');
const Lead = require('./models/Lead');
const config = require('./config');

const migrateToSaaS = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Check if Default Organization exists
        let defaultOrg = await Organization.findOne({ name: 'Default Company' });

        if (!defaultOrg) {
            console.log('Creating Default Organization...');
            defaultOrg = await Organization.create({
                name: 'Default Company',
                email: config.admin.email,
                sendgridApiKey: process.env.SENDGRID_API_KEY,
                fromEmail: process.env.SENDER_EMAIL, // Should be in env
                metaAccessToken: process.env.META_ACCESS_TOKEN, // Should be in env
                whatsappPhoneId: process.env.WHATSAPP_PHONE_ID,
                pageId: process.env.PAGE_ID || '123456789', // Add PAGE_ID to env if not there
                plan: 'enterprise'
            });
            console.log('Default Organization Created:', defaultOrg._id);
        } else {
            console.log('Default Organization already exists:', defaultOrg._id);
        }

        // 2. Update All Admins to belong to Default Org
        const admins = await Admin.find({ organizationId: { $exists: false } });
        console.log(`Found ${admins.length} admins without Org.`);

        for (const admin of admins) {
            admin.organizationId = defaultOrg._id;
            // Upgrade existing admin to 'admin' (Company Admin)
            if (admin.role === 'admin') admin.role = 'admin';
            await admin.save();
            console.log(`Updated Admin ${admin.email} to Default Org.`);
        }

        // 3. Update All Leads to belong to Default Org
        const leads = await Lead.find({ organizationId: { $exists: false } });
        console.log(`Found ${leads.length} leads without Org.`);

        for (const lead of leads) {
            lead.organizationId = defaultOrg._id;
            await lead.save();
        }
        console.log(`Migrated ${leads.length} leads to Default Org.`);

        console.log('Migration Complete');
        process.exit();

    } catch (error) {
        console.error('Migration Error:', error);
        process.exit(1);
    }
};

migrateToSaaS();
