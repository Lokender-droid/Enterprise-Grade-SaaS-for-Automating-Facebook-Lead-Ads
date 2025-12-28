/**
 * COMPREHENSIVE SYSTEM TEST SUITE
 * Tests all critical paths: DB, Settings, Leads, AI Agents, Auth
 */

const mongoose = require('mongoose');
const config = require('./config');
const Organization = require('./models/Organization');
const Lead = require('./models/Lead');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}`)
};

let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0
};

// Test Suite
const runTests = async () => {
    console.log('\n🚀 STARTING COMPREHENSIVE SYSTEM TEST\n');

    try {
        // ============================================
        // TEST 1: Database Connection
        // ============================================
        log.section('TEST 1: Database Connectivity');

        if (!config.mongoUri) {
            log.error('MONGO_URI not found in environment');
            testResults.failed++;
            process.exit(1);
        }

        await mongoose.connect(config.mongoUri);
        log.success('Database connected successfully');
        log.info(`Connection: ${mongoose.connection.host}`);
        testResults.passed++;

        // ============================================
        // TEST 2: Organization Settings
        // ============================================
        log.section('TEST 2: Organization Settings Persistence');

        let org = await Organization.findOne();

        if (!org) {
            log.warn('No organization found, creating test org...');
            org = await Organization.create({
                name: 'Test Organization',
                email: 'test@example.com',
                metaAccessToken: 'test_meta_token_123',
                pageId: 'test_page_456',
                sendgridApiKey: 'test_sendgrid_key',
                vapiPrivateKey: 'test_vapi_private',
                openaiApiKey: 'test_openai_key'
            });
            log.success('Test organization created');
            testResults.warnings++;
        } else {
            log.success('Organization found');
            log.info(`Name: ${org.name}`);
            log.info(`Email: ${org.email}`);
        }

        // Verify settings are retrievable
        const settingsCheck = {
            metaAccessToken: org.metaAccessToken ? '✅ Set' : '❌ Missing',
            pageId: org.pageId ? '✅ Set' : '❌ Missing',
            sendgridApiKey: org.sendgridApiKey ? '✅ Set' : '❌ Missing',
            vapiPrivateKey: org.vapiPrivateKey ? '✅ Set' : '❌ Missing',
            openaiApiKey: org.openaiApiKey ? '✅ Set' : '❌ Missing'
        };

        console.log('\nSettings Status:');
        Object.entries(settingsCheck).forEach(([key, status]) => {
            console.log(`  ${key}: ${status}`);
        });

        const missingSettings = Object.values(settingsCheck).filter(v => v.includes('❌')).length;
        if (missingSettings > 0) {
            log.warn(`${missingSettings} critical settings are missing`);
            testResults.warnings++;
        } else {
            log.success('All critical settings configured');
            testResults.passed++;
        }

        // ============================================
        // TEST 3: Lead Creation & Retrieval
        // ============================================
        log.section('TEST 3: Lead Management System');

        const testLeadId = 'test_lead_' + Date.now();
        const testLead = await Lead.create({
            fb_lead_id: testLeadId,
            name: 'Test Lead',
            email: 'testlead@example.com',
            phone: '+1234567890',
            organizationId: org._id,
            status: 'New'
        });

        log.success(`Lead created: ${testLead.name} (ID: ${testLead._id})`);

        // Verify retrieval
        const retrievedLead = await Lead.findById(testLead._id);
        if (retrievedLead && retrievedLead.name === 'Test Lead') {
            log.success('Lead retrieval successful');
            testResults.passed++;
        } else {
            log.error('Lead retrieval failed');
            testResults.failed++;
        }

        // ============================================
        // TEST 4: AI Services Integration Check
        // ============================================
        log.section('TEST 4: AI Services Configuration');

        const services = {
            'Voice Service (Vapi)': org.vapiPrivateKey,
            'Intelligence Service (OpenAI)': org.openaiApiKey,
            'Email Service (SendGrid)': org.sendgridApiKey,
            'Facebook Service': org.metaAccessToken
        };

        console.log('\nService Readiness:');
        Object.entries(services).forEach(([name, key]) => {
            // Check if key is a real API key (not test/placeholder)
            const isRealKey = key &&
                !key.includes('test_') &&
                !key.includes('placeholder') &&
                (key.startsWith('sk-') || key.startsWith('SG.') || key.startsWith('EAA') || key.length > 20);

            if (isRealKey) {
                log.success(`${name}: READY (Real key detected)`);
                testResults.passed++;
            } else if (key && (key.includes('test_') || key.includes('placeholder'))) {
                log.warn(`${name}: TEST MODE (Using mock key)`);
                testResults.warnings++;
            } else {
                log.error(`${name}: NOT CONFIGURED`);
                testResults.failed++;
            }
        });

        // ============================================
        // TEST 5: Authentication System
        // ============================================
        log.section('TEST 5: Authentication System');

        let admin = await Admin.findOne();

        if (!admin) {
            log.warn('No admin user found, creating test admin...');
            const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
            admin = await Admin.create({
                name: 'Test Admin',
                email: 'admin@test.com',
                password: hashedPassword,
                role: 'admin',
                organizationId: org._id
            });
            log.success('Test admin created');
            testResults.warnings++;
        } else {
            log.success('Admin user exists');
            log.info(`Email: ${admin.email}`);
            log.info(`Role: ${admin.role}`);
            testResults.passed++;
        }

        // Test password hashing
        const isPasswordHashed = admin.password.startsWith('$2');
        if (isPasswordHashed) {
            log.success('Password properly hashed (bcrypt)');
            testResults.passed++;
        } else {
            log.error('Password NOT hashed - SECURITY RISK!');
            testResults.failed++;
        }

        // ============================================
        // TEST 6: Database Indexes
        // ============================================
        log.section('TEST 6: Database Performance (Indexes)');

        const leadIndexes = await Lead.collection.getIndexes();
        const orgIndexes = await Organization.collection.getIndexes();

        log.info(`Lead collection indexes: ${Object.keys(leadIndexes).length}`);
        log.info(`Organization indexes: ${Object.keys(orgIndexes).length}`);

        if (Object.keys(leadIndexes).length > 1) {
            log.success('Indexes configured for performance');
            testResults.passed++;
        } else {
            log.warn('Consider adding indexes for better performance');
            testResults.warnings++;
        }

        // ============================================
        // TEST 7: Environment Variables
        // ============================================
        log.section('TEST 7: Environment Configuration');

        const requiredEnvVars = [
            'MONGO_URI',
            'JWT_SECRET',
            'PORT'
        ];

        const optionalEnvVars = [
            'SENDGRID_API_KEY',
            'VAPI_PRIVATE_KEY',
            'OPENAI_API_KEY',
            'PAGE_ACCESS_TOKEN'
        ];

        console.log('\nRequired Variables:');
        requiredEnvVars.forEach(varName => {
            if (process.env[varName]) {
                log.success(`${varName}: ✅`);
                testResults.passed++;
            } else {
                log.error(`${varName}: ❌ MISSING`);
                testResults.failed++;
            }
        });

        console.log('\nOptional Variables (for full functionality):');
        optionalEnvVars.forEach(varName => {
            if (process.env[varName]) {
                log.success(`${varName}: ✅`);
            } else {
                log.warn(`${varName}: Not set (features limited)`);
            }
        });

        // ============================================
        // CLEANUP
        // ============================================
        log.section('CLEANUP');

        // Delete test lead
        await Lead.deleteOne({ fb_lead_id: testLeadId });
        log.info('Test lead removed');

        // ============================================
        // FINAL REPORT
        // ============================================
        log.section('TEST SUMMARY');

        console.log(`\n✅ Passed:   ${colors.green}${testResults.passed}${colors.reset}`);
        console.log(`❌ Failed:   ${colors.red}${testResults.failed}${colors.reset}`);
        console.log(`⚠️  Warnings: ${colors.yellow}${testResults.warnings}${colors.reset}`);

        const totalTests = testResults.passed + testResults.failed;
        const successRate = ((testResults.passed / totalTests) * 100).toFixed(1);

        console.log(`\nSuccess Rate: ${successRate}%`);

        if (testResults.failed === 0) {
            log.success('\n🎉 ALL CRITICAL TESTS PASSED! System is operational.');
        } else {
            log.error(`\n⚠️  ${testResults.failed} CRITICAL ISSUES FOUND. Please review above.`);
        }

        if (testResults.warnings > 0) {
            log.warn(`\nℹ️  ${testResults.warnings} warnings detected. System will work but some features may be limited.`);
        }

        process.exit(testResults.failed > 0 ? 1 : 0);

    } catch (error) {
        log.error(`CRITICAL ERROR: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
};

// Run tests
runTests();
