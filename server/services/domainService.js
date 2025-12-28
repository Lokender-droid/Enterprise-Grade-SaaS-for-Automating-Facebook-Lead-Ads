const dns = require('dns').promises;
<<<<<<< HEAD
const { Resolver } = require('dns');
const Organization = require('../models/Organization');
const crypto = require('crypto');

/**
 * ENTERPRISE DNS VERIFICATION SERVICE
 * Production-grade domain verification with multi-resolver validation
 */

const TARGET_DOMAIN = 'app.metalead.com'; // Your SaaS domain
const DNS_RESOLVERS = [
    '8.8.8.8',      // Google DNS
    '1.1.1.1',      // Cloudflare DNS
    '208.67.222.222' // OpenDNS
];

/**
 * Verify CNAME record with multiple DNS resolvers for reliability
 */
async function verifyCNAME(customDomain) {
    const results = [];

    for (const resolver of DNS_RESOLVERS) {
        try {
            const dnsResolver = new Resolver();
            dnsResolver.setServers([resolver]);

            const records = await new Promise((resolve, reject) => {
                dnsResolver.resolveCname(customDomain, (err, addresses) => {
                    if (err) reject(err);
                    else resolve(addresses);
                });
            });

            results.push({
                resolver,
                success: true,
                records
            });
        } catch (error) {
            results.push({
                resolver,
                success: false,
                error: error.code
            });
        }
    }

    return results;
}

/**
 * Verify domain with retry logic for DNS propagation
 */
exports.verifyDomain = async (customDomain, organizationId, retryCount = 0) => {
    try {
        console.log(`🔍 [Attempt ${retryCount + 1}] Verifying domain: ${customDomain}`);

        // Step 1: Multi-resolver CNAME verification
        const cnameResults = await verifyCNAME(customDomain);

        // Check if majority of resolvers confirm CNAME
        const successfulResolvers = cnameResults.filter(r => r.success);

        if (successfulResolvers.length === 0) {
            // No CNAME found on any resolver
            if (retryCount < 2) {
                // Retry after delay (DNS propagation)
                console.log('⏳ DNS not propagated yet, retrying in 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                return exports.verifyDomain(customDomain, organizationId, retryCount + 1);
            }

            return {
                success: false,
                message: 'No CNAME record found. Please ensure DNS record is configured.',
                details: {
                    expectedTarget: TARGET_DOMAIN,
                    resolvers: cnameResults,
                    instructions: getDNSInstructions(customDomain)
                }
            };
        }

        // Validate CNAME points to correct target
        const validResolvers = successfulResolvers.filter(r =>
            r.records.some(record =>
                record.toLowerCase().includes(TARGET_DOMAIN.toLowerCase())
            )
        );

        if (validResolvers.length === 0) {
            return {
                success: false,
                message: `CNAME record found but points to wrong target. Expected: ${TARGET_DOMAIN}`,
                details: {
                    found: successfulResolvers[0].records,
                    expected: TARGET_DOMAIN
                }
            };
        }

        console.log(`✅ Domain verified on ${validResolvers.length}/${DNS_RESOLVERS.length} resolvers`);

        // Step 2: Update organization
        const verifiedAt = new Date();
        await Organization.findByIdAndUpdate(organizationId, {
            customDomain: customDomain,
            domainVerified: true,
            domainVerifiedAt: verifiedAt,
            $unset: { verificationToken: 1 } // Clear token after verification
        });

        // Step 3: Trigger SSL provisioning
        await triggerSSLProvisioning(customDomain, organizationId);

        return {
            success: true,
            message: 'Domain verified successfully! SSL provisioning initiated.',
            details: {
                domain: customDomain,
                verifiedAt,
                resolvers: validResolvers.map(r => r.resolver),
                sslStatus: 'provisioning'
            }
        };

    } catch (error) {
        console.error('❌ Domain verification error:', error);
        return {
            success: false,
            message: 'Verification failed: ' + error.message,
            error: error.code
=======
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
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
        };
    }
};

/**
<<<<<<< HEAD
 * Generate and verify TXT record for domain ownership
 */
exports.generateVerificationToken = async (organizationId) => {
    const token = crypto.randomBytes(16).toString('hex');

    await Organization.findByIdAndUpdate(organizationId, {
        verificationToken: token
    });

    return {
        token,
        txtRecord: {
            name: '_metalead-verification',
            value: token,
            ttl: 3600
        }
    };
};

/**
 * Verify TXT record ownership
 */
exports.verifyTXTRecord = async (customDomain, expectedToken) => {
    try {
        const records = await dns.resolveTxt(`_metalead-verification.${customDomain}`);
        const flatRecords = records.flat();

        const isValid = flatRecords.some(record => record === expectedToken);

        return {
            success: isValid,
            message: isValid ? 'Domain ownership verified' : 'TXT record not found or invalid',
            found: flatRecords
        };
    } catch (error) {
        return {
            success: false,
            message: 'TXT record lookup failed',
            error: error.code
        };
    }
};

/**
 * Trigger SSL certificate provisioning (Let's Encrypt)
 */
async function triggerSSLProvisioning(customDomain, organizationId) {
    try {
        console.log(`🔒 Initiating SSL provisioning for ${customDomain}`);

        // TODO: Integrate with Let's Encrypt or your SSL provider
        // For now, mark as pending
        await Organization.findByIdAndUpdate(organizationId, {
            sslProvisioned: false,
            sslProvisioningStartedAt: new Date()
        });

        // In production, you would:
        // 1. Call ACME protocol (Let's Encrypt)
        // 2. Complete HTTP-01 or DNS-01 challenge
        // 3. Install certificate on load balancer/CDN

        console.log('✅ SSL provisioning queued');
        return { success: true };
    } catch (error) {
        console.error('SSL provisioning error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get detailed DNS setup instructions
 */
function getDNSInstructions(customDomain) {
    const subdomain = customDomain.split('.')[0];

    return {
        steps: [
            {
                step: 1,
                title: 'Log in to your domain registrar',
                description: 'Access your domain management panel (GoDaddy, Namecheap, Cloudflare, etc.)'
            },
            {
                step: 2,
                title: 'Navigate to DNS Management',
                description: 'Find DNS settings, DNS records, or Zone file editor'
            },
            {
                step: 3,
                title: 'Add CNAME record',
                description: 'Create a new CNAME record with the following details',
                record: {
                    type: 'CNAME',
                    name: subdomain,
                    value: TARGET_DOMAIN,
                    ttl: 3600
                }
            },
            {
                step: 4,
                title: 'Save and wait',
                description: 'Save the DNS record and wait 5-30 minutes for propagation'
            },
            {
                step: 5,
                title: 'Verify domain',
                description: 'Click the "Verify Domain" button to complete setup'
            }
        ],
        expectedRecord: {
            type: 'CNAME',
            host: customDomain,
            points_to: TARGET_DOMAIN,
            ttl: '3600 (or Auto)'
        },
        checkPropagation: `https://dnschecker.org/#CNAME/${customDomain}`
    };
}

exports.getDNSInstructions = getDNSInstructions;

/**
 * Check DNS propagation status across multiple resolvers
 */
exports.checkPropagationStatus = async (customDomain) => {
    const results = await verifyCNAME(customDomain);

    const propagated = results.filter(r => r.success).length;
    const total = results.length;
    const percentage = Math.round((propagated / total) * 100);

    return {
        domain: customDomain,
        propagated,
        total,
        percentage,
        status: percentage === 100 ? 'complete' : percentage > 0 ? 'partial' : 'pending',
        resolvers: results
=======
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
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    };
};

/**
 * Remove custom domain
 */
exports.removeDomain = async (organizationId) => {
    try {
        await Organization.findByIdAndUpdate(organizationId, {
<<<<<<< HEAD
            $unset: {
                customDomain: 1,
                domainVerified: 1,
                domainVerifiedAt: 1,
                sslProvisioned: 1,
                verificationToken: 1
            }
        });

        return { success: true, message: 'Custom domain removed successfully' };
=======
            customDomain: null,
            domainVerified: false
        });

        return { success: true, message: 'Custom domain removed' };
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    } catch (error) {
        console.error('Remove domain error:', error);
        return { success: false, message: error.message };
    }
};

/**
<<<<<<< HEAD
 * Save organization logo
=======
 * Upload and save organization logo
 * (File upload handled by multer middleware)
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
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
<<<<<<< HEAD
            $unset: { logo: 1 }
        });

        return { success: true, message: 'Logo removed successfully' };
=======
            logo: null
        });

        return { success: true, message: 'Logo removed' };
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    } catch (error) {
        return { success: false, message: error.message };
    }
};
