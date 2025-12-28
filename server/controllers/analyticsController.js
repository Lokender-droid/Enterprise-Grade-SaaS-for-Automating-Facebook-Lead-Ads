const Lead = require('../models/Lead');
const mongoose = require('mongoose');

exports.getDashboardStats = async (req, res) => {
    try {
        const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);

        // 1. Leads by Status (for Pie/Donut Chart)
        const leadsByStatus = await Lead.aggregate([
            { $match: { organizationId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // 2. Leads over last 30 days (for Line/Bar Chart)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const leadsOverTime = await Lead.aggregate([
            {
                $match: {
                    organizationId,
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Conversion Rate
        const totalLeads = await Lead.countDocuments({ organizationId });
        const convertedLeads = await Lead.countDocuments({ organizationId, status: 'Converted' });
        const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

        res.json({
            leadsByStatus,
            leadsOverTime,
            summary: {
                totalLeads,
                convertedLeads,
                conversionRate: parseFloat(conversionRate)
            }
        });

    } catch (error) {
        console.error('Analytics Error', error);
        res.status(500).json({ message: 'Server error' });
    }
};
