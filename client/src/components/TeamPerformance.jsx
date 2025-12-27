import React, { useEffect, useState } from 'react';
import { getTeamPerformance } from '../services/api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Trophy, TrendingUp, Users, Clock } from 'lucide-react';

export default function TeamPerformance() {
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPerformance();
    }, []);

    const fetchPerformance = async () => {
        try {
            const data = await getTeamPerformance();
            setPerformance(data);
        } catch (error) {
            console.error("Failed to fetch team performance", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading team metrics...</div>;
    if (!performance) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

    const { leaderboard, stats, activityDistribution } = performance;

    // Transform leaderboard for charts
    const chartData = leaderboard.map(user => ({
        name: user.name,
        leads: user.leadsAssigned,
        conversions: user.leadsConverted,
        revenue: user.totalRevenue
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Top Performer</p>
                        <p className="text-lg font-bold text-gray-900">{leaderboard[0]?.name || 'N/A'}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Active Members</p>
                        <p className="text-lg font-bold text-gray-900">{leaderboard.length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                        <p className="text-lg font-bold text-gray-900">${chartData.reduce((a, b) => a + b.revenue, 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Avg Response</p>
                        <p className="text-lg font-bold text-gray-900">~2h 15m</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Rate by Agent */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Performance by Agent</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="leads" name="Assigned" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="conversions" name="Converted" fill="#10B981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800">Leaderboard</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                                <tr>
                                    <th className="p-4">Rank</th>
                                    <th className="p-4">Agent</th>
                                    <th className="p-4 text-center">Leads</th>
                                    <th className="p-4 text-center">Conv. Rate</th>
                                    <th className="p-4 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leaderboard.map((user, idx) => (
                                    <tr key={user.userId} className="hover:bg-gray-50/50">
                                        <td className="p-4">
                                            {idx < 3 ? (
                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white
                                                    ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                                                    {idx + 1}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 font-medium pl-2">{idx + 1}</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">{user.name}</td>
                                        <td className="p-4 text-center text-gray-600">{user.leadsAssigned}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                                                ${(user.leadsConverted / user.leadsAssigned || 0) > 0.3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {Math.round((user.leadsConverted / user.leadsAssigned || 0) * 100)}%
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-gray-700">${user.totalRevenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
