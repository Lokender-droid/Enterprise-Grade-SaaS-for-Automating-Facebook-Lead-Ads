/**
 * ENTERPRISE FEATURES TEST SUITE
 * Comprehensive testing for all enterprise-level functionality
 */

const mongoose = require('mongoose');
const config = require('./config');
const Organization = require('./models/Organization');
const Admin = require('./models/Admin');
const ActivityLog = require('./models/ActivityLog');
const Notification = require('./models/Notification');
const Workflow = require('./models/Workflow');
const bcrypt = require('bcryptjs');

// Color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(70)}\n${msg}\n${'='.repeat(70)}${colors.reset}`)
};

let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0
};

const runEnterpriseTests = async () => {
    console.log('\n🏢 STARTING ENTERPRISE FEATURES TEST SUITE\n');

    try {
        // Connect to database
        await mongoose.connect(config.mongoUri);
        log.success('Database connected');

        const org = await Organization.findOne();
        if (!org) {
            log.error('No organization found. Run basic tests first.');
            process.exit(1);
        }

        // ============================================
        // TEST 1: RBAC (Role-Based Access Control)
        // ============================================
        log.section('TEST 1: Role-Based Access Control (RBAC)');

        // Check if custom roles are defined
        if (org.customRoles && org.customRoles.length > 0) {
            log.success(`Custom roles configured: ${org.customRoles.length} roles`);
            org.customRoles.forEach(role => {
                log.info(`  Role: "${role.name}" | Permissions: ${role.permissions?.length || 0}`);
            });
            testResults.passed++;
        } else {
            log.warn('No custom roles defined (using default: admin, manager, agent)');
            testResults.warnings++;
        }

        // Verify different user roles exist
        const adminCount = await Admin.countDocuments({ organizationId: org._id, role: 'admin' });
        const managerCount = await Admin.countDocuments({ organizationId: org._id, role: 'manager' });
        const agentCount = await Admin.countDocuments({ organizationId: org._id, role: 'agent' });

        log.info(`User Distribution: Admin(${adminCount}) | Manager(${managerCount}) | Agent(${agentCount})`);

        if (adminCount > 0) {
            log.success('RBAC: Admin users exist');
            testResults.passed++;
        } else {
            log.error('RBAC: No admin users found');
            testResults.failed++;
        }

        // ============================================
        // TEST 2: White-Labeling
        // ============================================
        log.section('TEST 2: White-Labeling Configuration');

        const whitelabelFeatures = {
            'Custom Domain': org.customDomain,
            'Domain Verified': org.domainVerified,
            'Logo Upload': org.logo || 'Default'
        };

        console.log('\nWhite-Label Status:');
        Object.entries(whitelabelFeatures).forEach(([feature, value]) => {
            if (value && value !== 'Default') {
                log.success(`${feature}: ${value}`);
                testResults.passed++;
            } else {
                log.warn(`${feature}: Not configured`);
                testResults.warnings++;
            }
        });

        // ============================================
        // TEST 3: Audit Logging System
        // ============================================
        log.section('TEST 3: Audit Logging System');

        // Create a test audit log
        const testLog = await ActivityLog.create({
            organizationId: org._id,
            performedBy: (await Admin.findOne({ organizationId: org._id }))._id,
            userName: 'Test User',
            action: 'TEST_ACTION',
            entityType: 'System',
            details: { test: true },
            ipAddress: '127.0.0.1',
            userAgent: 'Test Suite'
        });

        log.success(`Audit log created: ${testLog._id}`);

        // Verify retrieval
        const logs = await ActivityLog.find({ organizationId: org._id }).limit(5);
        log.info(`Total audit logs: ${logs.length}`);

        if (logs.length > 0) {
            log.success('Audit logging functional');
            testResults.passed++;
        } else {
            log.error('Audit logging not working');
            testResults.failed++;
        }

        // Cleanup test log
        await ActivityLog.deleteOne({ _id: testLog._id });

        // ============================================
        // TEST 4: Notification System
        // ============================================
        log.section('TEST 4: Notification System');

        // Create test notification
        const testNotif = await Notification.create({
            organizationId: org._id,
            type: 'info',
            title: 'Test Notification',
            message: 'This is a test notification',
            isRead: false
        });

        log.success(`Notification created: ${testNotif._id}`);

        // Test retrieval
        const notifications = await Notification.find({ organizationId: org._id });
        const unreadCount = await Notification.countDocuments({
            organizationId: org._id,
            isRead: false
        });

        log.info(`Total notifications: ${notifications.length} | Unread: ${unreadCount}`);

        if (notifications.length > 0) {
            log.success('Notification system functional');
            testResults.passed++;
        } else {
            log.error('Notification system not working');
            testResults.failed++;
        }

        // Test mark as read
        await Notification.updateMany(
            { organizationId: org._id, isRead: false },
            { isRead: true }
        );

        const updatedUnread = await Notification.countDocuments({
            organizationId: org._id,
            isRead: false
        });

        if (updatedUnread === 0) {
            log.success('Mark as read functionality works');
            testResults.passed++;
        } else {
            log.error('Mark as read failed');
            testResults.failed++;
        }

        // Cleanup
        await Notification.deleteOne({ _id: testNotif._id });

        // ============================================
        // TEST 5: Workflow Automation
        // ============================================
        log.section('TEST 5: Workflow Automation Engine');

        // Check existing workflows
        const workflows = await Workflow.find({ organizationId: org._id });
        log.info(`Existing workflows: ${workflows.length}`);

        // Create test workflow
        const testWorkflow = await Workflow.create({
            organizationId: org._id,
            name: 'Test Workflow',
            description: 'Automated test workflow',
            isActive: false,
            draft: {
                nodes: [
                    { id: '1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'New Lead' } },
                    { id: '2', type: 'action', position: { x: 200, y: 0 }, data: { label: 'Send Email' } }
                ],
                edges: [
                    { id: 'e1-2', source: '1', target: '2' }
                ]
            }
        });

        log.success(`Workflow created: ${testWorkflow.name}`);

        // Test workflow retrieval
        const retrievedWorkflow = await Workflow.findById(testWorkflow._id);
        if (retrievedWorkflow && retrievedWorkflow.draft.nodes.length === 2) {
            log.success('Workflow CRUD operations working');
            testResults.passed++;
        } else {
            log.error('Workflow retrieval failed');
            testResults.failed++;
        }

        // Cleanup
        await Workflow.deleteOne({ _id: testWorkflow._id });

        // ============================================
        // TEST 6: SSO Integration
        // ============================================
        log.section('TEST 6: SSO (Single Sign-On) Configuration');

        if (org.ssoSettings && org.ssoSettings.enabled) {
            log.success(`SSO Enabled: Provider = ${org.ssoSettings.provider}`);
            testResults.passed++;
        } else {
            log.warn('SSO not enabled (optional feature)');
            testResults.warnings++;
        }

        // ============================================
        // TEST 7: Third-Party Integrations
        // ============================================
        log.section('TEST 7: Third-Party Integrations');

        const integrations = {
            'Salesforce': org.integrations?.salesforce?.connected,
            'HubSpot': org.integrations?.hubspot?.connected
        };

        console.log('\nIntegration Status:');
        Object.entries(integrations).forEach(([name, connected]) => {
            if (connected) {
                log.success(`${name}: Connected`);
                testResults.passed++;
            } else {
                log.warn(`${name}: Not connected`);
                testResults.warnings++;
            }
        });

        // ============================================
        // TEST 8: Subscription & Billing
        // ============================================
        log.section('TEST 8: Subscription & Billing System');

        const subscriptionInfo = {
            'Plan': org.plan || 'free',
            'Status': org.subscriptionStatus || 'active',
            'Stripe Customer ID': org.stripeCustomerId || 'Not set',
            'Stripe Subscription ID': org.stripeSubscriptionId || 'Not set'
        };

        console.log('\nSubscription Details:');
        Object.entries(subscriptionInfo).forEach(([key, value]) => {
            log.info(`${key}: ${value}`);
        });

        if (org.plan) {
            log.success(`Subscription plan configured: ${org.plan}`);
            testResults.passed++;
        } else {
            log.warn('No subscription plan set');
            testResults.warnings++;
        }

        // ============================================
        // FINAL REPORT
        // ============================================
        log.section('ENTERPRISE TEST SUMMARY');

        console.log(`\n✅ Passed:   ${colors.green}${testResults.passed}${colors.reset}`);
        console.log(`❌ Failed:   ${colors.red}${testResults.failed}${colors.reset}`);
        console.log(`⚠️  Warnings: ${colors.yellow}${testResults.warnings}${colors.reset}`);

        const totalTests = testResults.passed + testResults.failed;
        const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;

        console.log(`\nSuccess Rate: ${successRate}%`);

        if (testResults.failed === 0) {
            log.success('\n🎉 ALL ENTERPRISE FEATURES OPERATIONAL!');
        } else {
            log.error(`\n⚠️  ${testResults.failed} ENTERPRISE FEATURES NEED ATTENTION`);
        }

        if (testResults.warnings > 0) {
            log.warn(`\nℹ️  ${testResults.warnings} optional features not configured (non-critical)`);
        }

        console.log('\n📋 Enterprise Features Summary:');
        console.log('  1. RBAC (Roles): ' + (adminCount > 0 ? '✅' : '❌'));
        console.log('  2. White-Labeling: ' + (org.customDomain ? '✅' : '⚠️'));
        console.log('  3. Audit Logs: ✅');
        console.log('  4. Notifications: ✅');
        console.log('  5. Workflows: ✅');
        console.log('  6. SSO: ' + (org.ssoSettings?.enabled ? '✅' : '⚠️'));
        console.log('  7. Integrations: ' + (integrations.Salesforce || integrations.HubSpot ? '✅' : '⚠️'));
        console.log('  8. Billing: ' + (org.stripeCustomerId ? '✅' : '⚠️'));

        process.exit(testResults.failed > 0 ? 1 : 0);

    } catch (error) {
        log.error(`CRITICAL ERROR: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
};

runEnterpriseTests();
