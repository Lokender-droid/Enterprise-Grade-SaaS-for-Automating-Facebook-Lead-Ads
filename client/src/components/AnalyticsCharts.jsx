import React from 'react';
import { motion } from 'framer-motion';

export default function AnalyticsCharts({ data }) {
    if (!data) return null;

    const { leadsByStatus, leadsOverTime } = data;

    // --- Donut Chart Logic (Leads by Status) ---
    const totalStatusCount = leadsByStatus.reduce((acc, curr) => acc + curr.count, 0);
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const statusColors = {
        'New': '#3B82F6', // Blue
        'Contacted': '#F59E0B', // Amber
        'Converted': '#10B981', // Green
        'Lost': '#EF4444', // Red
        'Junk': '#6B7280' // Gray
    };

    // --- Bar Chart Logic (Leads Over Time) ---
    const maxDailyLeads = Math.max(...leadsOverTime.map(d => d.count), 1); // Avoid div by zero

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Status Distribution (Donut Chart) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
                <h3 className="text-lg font-bold text-gray-800 mb-6">Lead Status Distribution</h3>
                <div className="flex items-center justify-center gap-8">
                    <div className="relative w-48 h-48">
                        <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
                            {leadsByStatus.map((status, index) => {
                                const startPercent = cumulativePercent;
                                const slicePercent = status.count / totalStatusCount;
                                cumulativePercent += slicePercent;
                                const endPercent = cumulativePercent;

                                const [startX, startY] = getCoordinatesForPercent(startPercent);
                                const [endX, endY] = getCoordinatesForPercent(endPercent);

                                const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
                                const pathData = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

                                // Simple pie slices for now, using donut hole mask over it
                                return (
                                    <path
                                        key={status._id}
                                        d={pathData}
                                        fill={statusColors[status._id] || statusColors['Junk']}
                                    />
                                );
                            })}
                        </svg>
                        {/* Donut Hole */}
                        <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full flex items-center justify-center">
                            <div className="text-center">
                                <span className="block text-3xl font-bold text-gray-800">{totalStatusCount}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Total Leads</span>
                            </div>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="space-y-3">
                        {leadsByStatus.map(status => (
                            <div key={status._id} className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[status._id] || statusColors['Junk'] }}></span>
                                <span className="text-sm font-medium text-gray-700">{status._id}</span>
                                <span className="text-sm text-gray-400">({status.count})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Daily Trend (Bar Chart) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col"
            >
                <h3 className="text-lg font-bold text-gray-800 mb-6">Leads Trend (Last 30 Days)</h3>
                <div className="flex-1 flex items-end justify-between gap-1 overflow-x-auto pb-2">
                    {leadsOverTime.length === 0 && <p className="text-gray-400 m-auto">No data for the last 30 days</p>}
                    {leadsOverTime.map((day, index) => (
                        <div key={day._id} className="group relative flex flex-col items-center gap-1 w-full min-w-[20px]">
                            <div
                                className="w-full bg-blue-100 hover:bg-blue-500 transition-all rounded-t-sm relative"
                                style={{ height: `${(day.count / maxDailyLeads) * 150}px` }}
                            >
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                                    {day._id}: {day.count} Leads
                                </div>
                            </div>
                            {/* Only show date for every 5th item or start/end to avoid clutter */}
                            {(index % 5 === 0 || index === leadsOverTime.length - 1) && (
                                <span className="text-[10px] text-gray-400 rotate-0 whitespace-nowrap">
                                    {new Date(day._id).getDate()}/{new Date(day._id).getMonth() + 1}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
