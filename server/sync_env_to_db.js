/**
 * DIRECT DATABASE UPDATE SCRIPT
 * Populates Organization with test API keys to verify integration
 */

const mongoose = require('mongoose');
const config = require('./config');
const Organization = require('./models/Organization');

const updateOrgSettings = async () => {
    try {
        console.log('🔧 Connecting to database...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected\n');

        const org = await Organization.findOne();

        if (!org) {
            console.log('❌ No organization found. Creating one...');
            const newOrg = await Organization.create({
                name: 'Default Company',
                email: 'admin@example.com'
            });
            console.log('✅ Organization created');
        }

        console.log('📝 Current Settings:');
        console.log('  Meta Access Token:', org.metaAccessToken || '❌ NULL');
        console.log('  Vapi Private Key:', org.vapiPrivateKey || '❌ NULL');
        console.log('  OpenAI API Key:', org.openaiApiKey || '❌ NULL');
        console.log('  SendGrid API Key:', org.sendgridApiKey || '❌ NULL');

        console.log('\n🔄 Updating with values from .env file...\n');

        // Update from environment variables (if they exist)
        if (process.env.PAGE_ACCESS_TOKEN) {
            org.metaAccessToken = process.env.PAGE_ACCESS_TOKEN;
            console.log('✅ Set Meta Access Token from .env');
        }

        if (process.env.VAPI_PRIVATE_KEY) {
            org.vapiPrivateKey = process.env.VAPI_PRIVATE_KEY;
            console.log('✅ Set Vapi Private Key from .env');
        }

        if (process.env.VAPI_PUBLIC_KEY) {
            org.vapiPublicKey = process.env.VAPI_PUBLIC_KEY;
            console.log('✅ Set Vapi Public Key from .env');
        }

        if (process.env.OPENAI_API_KEY) {
            org.openaiApiKey = process.env.OPENAI_API_KEY;
            console.log('✅ Set OpenAI API Key from .env');
        }

        if (process.env.SENDGRID_API_KEY) {
            org.sendgridApiKey = process.env.SENDGRID_API_KEY;
            console.log('✅ Set SendGrid API Key from .env');
        }

        if (process.env.PAGE_ID) {
            org.pageId = process.env.PAGE_ID;
            console.log('✅ Set Page ID from .env');
        }

        await org.save();

        console.log('\n✅ Organization settings updated successfully!');
        console.log('\n📊 New Settings:');
        console.log('  Meta Access Token:', org.metaAccessToken ? '✅ SET' : '❌ NULL');
        console.log('  Vapi Private Key:', org.vapiPrivateKey ? '✅ SET' : '❌ NULL');
        console.log('  OpenAI API Key:', org.openaiApiKey ? '✅ SET' : '❌ NULL');
        console.log('  SendGrid API Key:', org.sendgridApiKey ? '✅ SET' : '❌ NULL');

        console.log('\n💡 Next Steps:');
        console.log('1. Run: node test_full_system.js');
        console.log('2. All tests should now pass');
        console.log('3. AI services will use these keys automatically\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

updateOrgSettings();
