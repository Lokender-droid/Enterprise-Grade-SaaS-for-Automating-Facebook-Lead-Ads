/**
 * PREDICTIVE REVENUE MODELING
 * Estimates the Potential Lifetime Value (LTV) of the lead.
 */
exports.predictRevenueValue = async (lead) => {
    try {
        console.log(`$$ Predicting Revenue for ${lead.email}...`);

        let estimatedValue = 0;
        const email = lead.email || '';
        const domain = email.split('@')[1];

        // 1. Domain valuation
        if (['gmail.com', 'yahoo.com', 'hotmail.com'].includes(domain)) {
            estimatedValue += 1000; // Small business / Individual
        } else {
            estimatedValue += 10000; // Corporate -> Higher base value

            // Mock Industry Multipliers (In real app, use Clearbit/Apollo data)
            if (domain.includes('tech') || domain.includes('soft') || domain.includes('ai')) {
                estimatedValue *= 2.5; // High value tech
            }
            if (domain.includes('finance') || domain.includes('bank')) {
                estimatedValue *= 3.0; // High value finance
            }
        }

        // 2. Phone valuation
        if (lead.phone) estimatedValue += 500;

        // 3. Name valuation (Full name check)
        if (lead.name && lead.name.trim().split(' ').length > 1) {
            estimatedValue *= 1.1; // Slightly more reliable
        }

        // Save
        lead.predictedRevenue = Math.floor(estimatedValue);
        await lead.save();

        return estimatedValue;

    } catch (error) {
        console.error('❌ Revenue Prediction Failed:', error);
        return 0;
    }
};
