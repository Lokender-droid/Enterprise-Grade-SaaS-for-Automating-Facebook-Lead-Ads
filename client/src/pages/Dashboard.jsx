import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { getLeads, logout, updateLeadStatus, getTeam, createUser, assignLead, deleteLead, deleteLeads, getAnalytics, getSettings } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import {
    Users,
    Mail,
    MessageSquare,
    Settings as SettingsIcon,
    LogOut,
    Menu,
    X,
    Filter,
    Download,
    Trash2,
    Search,
    UserCircle,
    Plus,
    Shield,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    CreditCard,
    TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import UserManagement from '../components/UserManagement';
import AnalyticsCharts from '../components/AnalyticsCharts';
import AIChatWidget from '../components/AIChatWidget';

const socket = io('http://localhost:4000'); // Check port!

function StatCard({ title, value, icon: Icon, color, subtext }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    );
}

function StatusBadge({ status, type }) {
    const styles = {
        sent: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-800',
        failed: 'bg-red-100 text-red-700'
    };

    // Default to pending if unknown
    const statusKey = status || 'pending';

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[statusKey] || 'bg-gray-100 text-gray-600'}`}>
            {statusKey.toUpperCase()}
        </span>
    );
}

function ScoreBadge({ score, reason }) {
    if (score === undefined || score === null) return <span className="text-xs text-gray-400">-</span>;

    let color = 'bg-red-100 text-red-800';
    if (score >= 70) color = 'bg-green-100 text-green-800';
    else if (score >= 40) color = 'bg-yellow-100 text-yellow-800';

    return (
        <div className="flex flex-col items-center group relative cursor-help">
            <span className={`px-2 py-0.5 text-xs font-bold rounded ${color}`}>
                {score}/100
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-50">
                {reason || 'No analysis available'}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [leads, setLeads] = useState([]);
    // const [stats, setStats] = useState({ total: 0, emailSent: 0, whatsappSent: 0 }); // Replaced by analyticsData
    const [analyticsData, setAnalyticsData] = useState(null);
    const [team, setTeam] = useState([]);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedLeads, setSelectedLeads] = useState([]);

    // Get logged in user to check role
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin' || user.role === undefined; // Default to admin for legacy users

    const fetchLeads = async () => {
        try {
            const data = await getLeads({ status: filterStatus });
            setLeads(data);
            // calculateStats(data); // Using server analytics now
        } catch (error) {
            console.error('Failed to fetch leads', error);
            if (error.response && error.response.status === 401) logout();
        }
    };

    const fetchAnalytics = async () => {
        try {
            const data = await getAnalytics();
            setAnalyticsData(data);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        }
    };

    const fetchTeam = async () => {
        if (isAdmin) {
            try {
                const data = await getTeam();
                setTeam(data);
            } catch (error) {
                console.error('Failed to fetch team', error);
            }
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await createUser(newUser);
            alert('Sales User Created!');
            setShowTeamModal(false);
            setNewUser({ name: '', email: '', password: '' });
            fetchTeam();
        } catch (error) {
            console.error('Create user error:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to create user';
            alert(`Error: ${msg}`);
        }
    };

    const handleAssign = async (leadId, userId) => {
        try {
            await assignLead(leadId, userId);
            setLeads(prev => prev.map(l => l._id === leadId ? { ...l, assignedTo: team.find(u => u._id === userId) } : l));
        } catch (error) {
            console.error('Assign failed', error);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            // Optimistic update
            setLeads(prev => prev.map(l => l._id === id ? { ...l, status: newStatus } : l));
            await updateLeadStatus(id, newStatus);
            fetchAnalytics(); // Refresh stats
        } catch (error) {
            console.error('Status update failed', error);
            fetchLeads(); // Revert on fail
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this lead? This cannot be undone.")) return;
        try {
            await deleteLead(id);
            // Optimistic update
            setLeads(prev => prev.filter(l => l._id !== id));
            setSelectedLeads(prev => prev.filter(lid => lid !== id));
            fetchAnalytics();
        } catch (error) {
            console.error('Delete failed', error);
            alert('Failed to delete lead');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedLeads.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedLeads.length} leads? This cannot be undone.`)) return;

        try {
            await deleteLeads(selectedLeads);
            // Optimistic removal
            setLeads(prev => prev.filter(l => !selectedLeads.includes(l._id)));
            setSelectedLeads([]);
            fetchAnalytics();
            alert('Leads deleted successfully');
        } catch (error) {
            console.error('Bulk delete failed', error);
            alert('Failed to delete leads');
        }
    };

    const toggleSelectAll = () => {
        if (selectedLeads.length === leads.length && leads.length > 0) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(leads.map(l => l._id));
        }
    };

    const toggleSelect = (id) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(prev => prev.filter(lid => lid !== id));
        } else {
            setSelectedLeads(prev => [...prev, id]);
        }
    };

    const handleExport = () => {
        const headers = ['Name,Email,Phone,Date,Status,Assigned To'];
        const csvRows = leads.map(l => [
            `"${l.name}"`,
            `"${l.email}"`,
            `"${l.phone}"`,
            `"${format(new Date(l.createdAt), 'yyyy-MM-dd HH:mm')}"`,
            `"${l.status}"`,
            `"${l.assignedTo?.name || 'Unassigned'}"`
        ].join(','));

        const csvString = [headers, ...csvRows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `leads_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchLeads();
        fetchAnalytics(); // Fetch initial analytics
        fetchTeam();

        socket.on('new_lead', (newLead) => {
            setLeads((prev) => [newLead, ...prev]);
            fetchAnalytics();
        });

        socket.on('update_lead', (updatedLead) => {
            setLeads((prev) => prev.map(l => l._id === updatedLead._id ? updatedLead : l));
            fetchAnalytics();
        });

        socket.on('delete_lead', (deletedId) => {
            setLeads((prev) => prev.filter(l => l._id !== deletedId));
            setSelectedLeads(prev => prev.filter(id => id !== deletedId));
            fetchAnalytics();
        });

        socket.on('bulk_delete', (deletedIds) => {
            setLeads((prev) => prev.filter(l => !deletedIds.includes(l._id)));
            setSelectedLeads(prev => prev.filter(id => !deletedIds.includes(id)));
            fetchAnalytics();
        });

        return () => {
            socket.off('new_lead');
            socket.off('update_lead');
            socket.off('delete_lead');
        };
    }, []);

    // Re-fetch when filter changes
    useEffect(() => {
        fetchLeads();
    }, [filterStatus]);

    // Check for onboarding status
    const [setupRequired, setSetupRequired] = useState(false);

    useEffect(() => {
        const checkSetup = async () => {
            // We can use getSettings to check if Meta is connected
            // Ideally this should be a dedicated endpoint or part of /me, but this works
            try {
                // Keep it lightweight - if we already fetched something else indicating status use that
                // Here we'll do a quick check
                if (isAdmin) {
                    const settings = await getSettings();
                    if (!settings.metaAccessToken || !settings.pageId) {
                        setSetupRequired(true);
                    }
                }
            } catch (e) {
                // If it fails (e.g. 404 for super admin or network), ignore or handle
                console.log('Setup check skipped', e);
            }
        };
        checkSetup();
    }, [isAdmin]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Setup Guide Banner */}
            {setupRequired && (
                <div className="bg-indigo-600 text-white px-6 py-3 shadow-md">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-3 text-center md:text-left">
                            <span className="bg-white text-indigo-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider shrink-0">Get Started</span>
                            <p className="text-sm font-medium">Your account is not fully configured. Connect your Facebook Page to start receiving leads.</p>
                        </div>
                        <Link to="/settings" className="w-full md:w-auto text-center text-sm font-bold bg-indigo-500 hover:bg-indigo-400 px-4 py-1.5 rounded transition shrink-0">
                            Go to Settings &rarr;
                        </Link>
                    </div>
                </div>
            )}

            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-40">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
                    WKPC Meta Automation
                </h1>
                <div className="flex flex-wrap justify-center items-center gap-4">
                    {isAdmin && (
                        <button onClick={() => setShowTeamModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
                            <Plus className="w-4 h-4" /> Manage Team
                        </button>
                    )}
                    <Link to="/workflows" className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                        <Users className="w-5 h-5 mr-1" /> {/* Reusing Users icon or similar until imported */}
                        Automation
                    </Link>
                    <Link to="/billing" className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                        <CreditCard className="w-5 h-5 mr-1" />
                        Billing
                    </Link>
                    <Link to="/settings" className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                        <SettingsIcon className="w-5 h-5 mr-1" />
                        Settings
                    </Link>
                    <Link to="/profile" className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                        <UserCircle className="w-5 h-5 mr-1" />
                        Profile
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">{user.name || 'Admin'}</span>
                        <span className="text-xs uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">{user.role || 'Admin'}</span>
                    </div>
                    <button onClick={logout} className="text-gray-500 hover:text-red-600 transition flex items-center gap-2 text-sm font-medium">
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </nav>

            {/* Team Modal */}
            <UserManagement
                isOpen={showTeamModal}
                onClose={() => setShowTeamModal(false)}
                onUserCreated={fetchTeam}
            />

            <main className="p-6 max-w-7xl mx-auto">
                {/* Analytics Section */}
                {analyticsData && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <StatCard
                                title="Total Leads"
                                value={analyticsData.summary.totalLeads}
                                icon={Users}
                                color="bg-blue-500"
                                subtext="All time"
                            />
                            <StatCard
                                title="Converted Leads"
                                value={analyticsData.summary.convertedLeads}
                                icon={CheckCircle}
                                color="bg-green-500"
                                subtext={`${analyticsData.summary.conversionRate}% Conversion Rate`}
                            />
                            <StatCard
                                title="Recent Activity"
                                value={analyticsData.leadsOverTime.reduce((acc, curr) => acc + curr.count, 0)}
                                icon={TrendingUp}
                                color="bg-purple-600"
                                subtext="Last 30 days"
                            />
                        </div>

                        {/* Charts */}
                        <AnalyticsCharts data={analyticsData} />
                    </>
                )}

                {/* Leads Table Container */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-lg font-bold text-gray-800">Recent Leads</h2>
                        <div className="flex items-center gap-3">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="text-sm border-gray-200 rounded-lg focus:ring-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Interested">Interested</option>
                                <option value="Converted">Converted</option>
                                <option value="Lost">Lost</option>
                            </select>
                            <button onClick={() => { fetchLeads(); fetchAnalytics(); }} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                                <RefreshCw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleExport}
                                className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600"
                                title="Export to Excel"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                            {selectedLeads.length > 0 && isAdmin && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-600 transition"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete ({selectedLeads.length})
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={leads.length > 0 && selectedLeads.length === leads.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">AI Score</th>
                                    {isAdmin && <th className="px-6 py-4">Assigned To</th>}
                                    <th className="px-6 py-4 text-center">Email</th>
                                    <th className="px-6 py-4 text-center">WhatsApp</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leads.map((lead) => (
                                    <tr key={lead._id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedLeads.includes(lead._id)}
                                                onChange={() => toggleSelect(lead._id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{lead.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex flex-col">
                                                <span>{lead.email}</span>
                                                <span className="text-xs text-gray-400">{lead.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {format(new Date(lead.createdAt), 'MMM dd, HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <select
                                                value={lead.status || 'New'}
                                                onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                                                className={`text-xs font-bold px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                                                    lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                                                        lead.status === 'Interested' ? 'bg-green-100 text-green-800' :
                                                            lead.status === 'Converted' ? 'bg-purple-100 text-purple-800' :
                                                                'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                <option value="New">New</option>
                                                <option value="Contacted">Contacted</option>
                                                <option value="Interested">Interested</option>
                                                <option value="Converted">Converted</option>
                                                <option value="Lost">Lost</option>
                                                <option value="Lost">Lost</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <ScoreBadge score={lead.leadScore} reason={lead.scoreReason} />
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4">
                                                <select
                                                    value={lead.assignedTo?._id || ''}
                                                    onChange={(e) => handleAssign(lead._id, e.target.value)}
                                                    className="w-full text-xs border-gray-200 rounded-lg"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {team.map(t => (
                                                        <option key={t._id} value={t._id}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={lead.emailStatus} type="email" />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={lead.whatsappStatus} type="whatsapp" />
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <a href={`/leads/${lead._id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</a>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDelete(lead._id)}
                                                    className="text-gray-400 hover:text-red-600 transition"
                                                    title="Delete Lead"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {leads.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                                            No leads found yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <AIChatWidget />
            </main>
        </div>
    );
}
