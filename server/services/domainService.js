const dns = require('dns').promises;
const Organization = require('../models/Organization');

/**
 * WHITE-LABELING SERVICE
 * Handles custom domain verification and logo management
 */

/**
 * Verify custom domain ownership via DNS CNAME record
 * Expected: CNAME pointing to our main domain
 */
exports.verifyDomain = async (customDomain, organizationId) => {
    try {
        console.log(`🔍 Verifying domain: ${customDomain}`);

        // Expected CNAME target (your main SaaS domain)
        const expectedTarget = 'app.yoursaas.com'; // Change this to your actual domain

        // Lookup CNAME records
        try {
            const records = await dns.resolveCname(customDomain);

            console.log(`Found CNAME records:`, records);

            // Check if any record points to our domain
            const isValid = records.some(record =>
                record.toLowerCase().includes(expectedTarget.toLowerCase()) ||
                record.toLowerCase().includes('yoursaas')
            );

            if (isValid) {
                console.log('✅ Domain verified successfully');

                // Update organization
                await Organization.findByIdAndUpdate(organizationId, {
                    customDomain: customDomain,
                    domainVerified: true
                });

                return {
                    success: true,
                    message: 'Domain verified successfully',
                    records
                };
            } else {
                return {
                    success: false,
                    message: `CNAME record must point to ${expectedTarget}`,
                    found: records
                };
            }

        } catch (dnsError) {
            // No CNAME found
            if (dnsError.code === 'ENODATA' || dnsError.code === 'ENOTFOUND') {
                return {
                    success: false,
                    message: 'No CNAME record found. Please add a CNAME record pointing to ' + expectedTarget,
                    instructions: {
                        type: 'CNAME',
                        name: customDomain,
                        value: expectedTarget,
                        ttl: 3600
                    }
                };
            }
            throw dnsError;
        }

    } catch (error) {
        console.error('Domain verification error:', error);
        return {
            success: false,
            message: 'Domain verification failed: ' + error.message
        };
    }
};

/**
 * Get DNS instructions for user
 */
exports.getDNSInstructions = (customDomain) => {
    return {
        type: 'CNAME',
        host: customDomain,
        value: 'app.yoursaas.com', // Your main domain
        ttl: 3600,
        instructions: [
            '1. Go to your domain registrar (GoDaddy, Namecheap, etc.)',
            '2. Navigate to DNS settings',
            '3. Add a new CNAME record:',
            `   - Name/Host: ${customDomain}`,
            '   - Value/Points to: app.yoursaas.com',
            '   - TTL: 3600 (or Auto)',
            '4. Wait 5-10 minutes for DNS propagation',
            '5. Click "Verify Domain" button'
        ]
    };
};

/**
 * Remove custom domain
 */
exports.removeDomain = async (organizationId) => {
    try {
        await Organization.findByIdAndUpdate(organizationId, {
            customDomain: null,
            domainVerified: false
        });

        return { success: true, message: 'Custom domain removed' };
    } catch (error) {
        console.error('Remove domain error:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Upload and save organization logo
 * (File upload handled by multer middleware)
 */
exports.saveLogo = async (organizationId, logoPath) => {
    try {
        await Organization.findByIdAndUpdate(organizationId, {
            logo: logoPath
        });

        return { success: true, logoUrl: logoPath };
    } catch (error) {
        console.error('Save logo error:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Remove logo
 */
exports.removeLogo = async (organizationId) => {
    try {
        await Organization.findByIdAndUpdate(organizationId, {
            logo: null
        });

        return { success: true, message: 'Logo removed' };
    } catch (error) {
        return { success: false, message: error.message };
    }
};
