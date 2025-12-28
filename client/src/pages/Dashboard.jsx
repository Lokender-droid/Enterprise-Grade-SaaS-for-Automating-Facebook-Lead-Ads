import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { getLeads, logout, updateLeadStatus, getTeam, createUser, assignLead, deleteLead, deleteLeads, getAnalytics, getSettings, getStages } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import {
    Users,
    Mail,
    MessageSquare,
    LayoutDashboard,
    ArrowUpRight,
    MoreHorizontal,
    LayoutList,
    LayoutGrid,

    CheckCircle,
    Trophy,
    Download,
    Trash2,
    Search,
    UserCircle,
    Plus,
    Shield,
    RefreshCw,
    XCircle,
    Clock,
    CreditCard,
    TrendingUp,
    Zap,
    Filter,
    Settings as SettingsIcon,
    LogOut,
    Eye,
    EyeOff,
    Save,
    Upload,
    Globe,
    Lock,
    Server,
    AlertCircle,
    Loader2,
    Building,
    ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import UserManagement from '../components/UserManagement';
import AnalyticsCharts from '../components/AnalyticsCharts';
import AIChatWidget from '../components/AIChatWidget';
import KanbanBoard from '../components/KanbanBoard';
import TeamPerformance from '../components/TeamPerformance';

const socket = io('http://localhost:4000');

// --- Components ---

function StatCard({ title, value, icon: Icon, color, subtext, trend }) {
    return (
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/20 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('bg-', 'bg-').replace('500', '100')} rounded-full blur-3xl opacity-20 -mr-10 -mt-10 transition-opacity group-hover:opacity-40`}></div>

            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
                        {trend && (
                            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" /> {trend}
                            </span>
                        )}
                    </div>
                </div>
                <div className={`p-3 rounded-xl ${color} shadow-lg shadow-indigo-500/20 text-white transform group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {subtext && <p className="text-sm text-gray-400 mt-4 font-medium flex items-center gap-1">{subtext}</p>}
        </div>
    );
}

function StatusBadge({ status, type }) {
    const styles = {
        sent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        failed: 'bg-rose-100 text-rose-700 border-rose-200',
        // Lead Statuses
        New: 'bg-blue-50 text-blue-700 border-blue-200',
        Contacted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        Interested: 'bg-teal-50 text-teal-700 border-teal-200',
        Converted: 'bg-purple-50 text-purple-700 border-purple-200',
        Lost: 'bg-slate-100 text-slate-600 border-slate-200'
    };

    const statusKey = status || 'pending';
    const cleanStatus = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);

    return (
        <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded-full border ${styles[statusKey] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {cleanStatus}
        </span>
    );
}

function ScoreBadge({ score, reason }) {
    if (score === undefined || score === null) return <span className="text-gray-300">-</span>;

    let color = 'text-red-600 bg-red-50 border-red-100';
    if (score >= 70) color = 'text-emerald-600 bg-emerald-50 border-emerald-100';
    else if (score >= 40) color = 'text-amber-600 bg-amber-50 border-amber-100';

    return (
        <div className="group relative cursor-help inline-block">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${color}`}>
                <Zap className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold">{score}</span>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl z-50 pointer-events-none">
                <div className="font-bold mb-1 border-b border-slate-700 pb-1">AI Reasoning</div>
                {reason || 'No analysis available'}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [leads, setLeads] = useState([]);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [team, setTeam] = useState([]);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [stages, setStages] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin' || user.role === undefined;

    // --- Data Fetching & WebSockets (Same Logic, New UI) ---
    const fetchLeads = async () => {
        try {
            const data = await getLeads({ status: filterStatus });
            setLeads(data);
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

    const fetchStages = async () => {
        try {
            const data = await getStages();
            setStages(data);
        } catch (error) {
            console.error('Failed to fetch stages', error);
        }
    };

    useEffect(() => {
        fetchLeads();
        fetchAnalytics();
        fetchTeam();
        fetchStages();

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

    useEffect(() => {
        fetchLeads();
    }, [filterStatus]);


    // Handlers
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
            fetchAnalytics();
        } catch (error) {
            console.error('Status update failed', error);
            fetchLeads();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this lead?")) return;
        try {
            await deleteLead(id);
            setLeads(prev => prev.filter(l => l._id !== id));
            setSelectedLeads(prev => prev.filter(lid => lid !== id));
            fetchAnalytics();
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedLeads.length === 0) return;
        if (!window.confirm(`Delete ${selectedLeads.length} leads?`)) return;

        try {
            await deleteLeads(selectedLeads);
            setLeads(prev => prev.filter(l => !selectedLeads.includes(l._id)));
            setSelectedLeads([]);
            fetchAnalytics();
        } catch (error) {
            console.error('Bulk delete failed', error);
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

    const [setupRequired, setSetupRequired] = useState(false);
    useEffect(() => {
        const checkSetup = async () => {
            if (isAdmin) {
                try {
                    const settings = await getSettings();
                    if (!settings.metaAccessToken || !settings.pageId) {
                        setSetupRequired(true);
                    }
                } catch (e) {
                    // Ignore
                }
            }
        };
        checkSetup();
    }, [isAdmin]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
            {/* Dynamic Background */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-indigo-200 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-blue-200 rounded-full blur-[100px] opacity-20"></div>
            </div>

            {/* Sticky Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 rounded-lg p-1.5 shadow-lg shadow-indigo-500/30">
                            <LayoutDashboard className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">
                            WKPC Meta Automation
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 md:gap-6 bg-slate-50 md:bg-transparent p-1 md:p-0 rounded-full md:rounded-none">
                        <div className="flex items-center gap-1">
                            <Link to="/tasks" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                                <CheckCircle className="w-4 h-4" /> <span className="hidden sm:inline">Tasks</span>
                            </Link>
                            <Link to="/billing" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                                <CreditCard className="w-4 h-4" /> <span className="hidden sm:inline">Billing</span>
                            </Link>
                            <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                                <SettingsIcon className="w-4 h-4" /> <span className="hidden sm:inline">Settings</span>
                            </Link>
                        </div>

                        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

                        <div className="flex items-center gap-3 pl-2">
                            <div className="flex flex-col items-end hidden sm:flex">
                                <span className="text-sm font-bold text-slate-800">{user.name || 'Admin'}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">{user.role || 'Admin'}</span>
                            </div>
                            <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                <UserCircle className="w-5 h-5 text-indigo-600" />
                            </div>
                            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-1" title="Logout">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Banner */}
            {setupRequired && (
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg mx-6 mt-6 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto animate-fade-in-down">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-full animate-pulse">
                            <SettingsIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm md:text-base">Complete your configuration</p>
                            <p className="text-xs md:text-sm text-indigo-100 opacity-90">Connect your Facebook Page to start receiving leads automatically.</p>
                        </div>
                    </div>
                    <Link to="/settings" className="whitespace-nowrap bg-white text-indigo-600 px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-50 transition-transform transform hover:-translate-y-0.5">
                        Finish Setup &rarr;
                    </Link>
                </div>
            )}

            <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
                        <p className="text-slate-500 mt-1">Real-time insights and lead management.</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setShowTeamModal(true)}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2 text-sm font-semibold"
                        >
                            <Plus className="w-4 h-4" /> Invite Team Member
                        </button>
                    )}
                </div>

                {/* Stats Grid */}
                {analyticsData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title="Total Leads"
                            value={analyticsData.summary.totalLeads}
                            icon={Users}
                            color="bg-blue-500"
                        // trend={analyticsData.summary.totalLeads > 0 ? "+ Realtime" : null} 
                        />
                        <StatCard
                            title="Converted"
                            value={analyticsData.summary.convertedLeads}
                            icon={CheckCircle}
                            color="bg-emerald-500"
                            trend={analyticsData.summary.totalLeads > 0 ? `${analyticsData.summary.conversionRate}% Rate` : null}
                        />
                        <StatCard
                            title="AI Processed"
                            // Using total leads as proxy for AI processed since all leads are handled by the system
                            value={analyticsData.summary.totalLeads}
                            icon={Zap}
                            color="bg-purple-600"
                            subtext="Automated Interactions"
                        />
                    </div>
                )}

                {/* Charts Section */}
                {analyticsData && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                Growth Analytics
                            </h3>
                            <select className="bg-slate-50 border-none text-xs font-semibold text-slate-500 rounded-lg py-1 px-3">
                                <option>Last 30 Days</option>
                                <option>Last 7 Days</option>
                            </select>
                        </div>
                        <AnalyticsCharts data={analyticsData} />
                    </div>
                )}

                {/* Leads Table Card */}
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    {/* Table Header / Toolbar */}
                    <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800">Recent Leads</h3>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{leads.length}</span>
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="List View"
                            >
                                <LayoutList className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('board')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Board View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setViewMode('team')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'team' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    title="Team Performance"
                                >
                                    <Trophy className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            {/* Filter */}
                            <div className="relative group">
                                <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 hover:bg-white transition-colors cursor-pointer appearance-none min-w-[140px]"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Converted">Converted</option>
                                    <option value="Lost">Lost</option>
                                </select>
                            </div>

                            <button
                                onClick={() => { fetchLeads(); fetchAnalytics(); }}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>

                            <div className="h-6 w-px bg-slate-200 mx-1"></div>

                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                            >
                                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
                            </button>

                            {selectedLeads.length > 0 && isAdmin && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 shadow-sm transition-colors animate-pulse"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete ({selectedLeads.length})
                                </button>
                            )}
                        </div>
                    </div>

                </div>

                {viewMode === 'board' ? (
                    <div className="bg-slate-50/50 min-h-[500px]">
                        <KanbanBoard
                            leads={leads}
                            stages={stages}
                            onLeadUpdate={() => { fetchLeads(); fetchAnalytics(); }}
                        />
                    </div>
                ) : viewMode === 'team' ? (
                    <div className="min-h-[500px]">
                        <TeamPerformance />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <th className="p-4 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            checked={leads.length > 0 && selectedLeads.length === leads.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="p-4">Lead Details</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">AI Score</th>
                                    <th className="p-4">Comms</th>
                                    {isAdmin && <th className="p-4">Assignee</th>}
                                    <th className="p-4 text-right">Added</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leads.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                    <Users className="w-8 h-8 opacity-50" />
                                                </div>
                                                <p className="text-lg font-medium text-slate-600">No leads found</p>
                                                <p className="text-sm">Connect your Facebook page or wait for new leads.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr key={lead._id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity"
                                                    checked={selectedLeads.includes(lead._id)}
                                                    onChange={() => toggleSelect(lead._id)}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                        {lead.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{lead.name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <Mail className="w-3 h-3" /> {lead.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    value={lead.status || 'New'}
                                                    onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                                                    className={`text-xs font-bold px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none text-center min-w-[100px]
                                                        ${lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                                                            lead.status === 'Contacted' ? 'bg-indigo-100 text-indigo-800' :
                                                                lead.status === 'Interested' ? 'bg-emerald-100 text-emerald-800' :
                                                                    lead.status === 'Converted' ? 'bg-purple-100 text-purple-800' :
                                                                        'bg-red-100 text-red-800'}`}
                                                >
                                                    <option value="New">NEW</option>
                                                    <option value="Contacted">CONTACTED</option>
                                                    <option value="Interested">INTERESTED</option>
                                                    <option value="Converted">CONVERTED</option>
                                                    <option value="Lost">LOST</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-center">
                                                <ScoreBadge score={lead.leadScore} reason={lead.scoreReason} />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="tooltip" title={`Email: ${lead.emailStatus}`}>
                                                        <StatusBadge status={lead.emailStatus} type="email" />
                                                    </div>
                                                    {/* Add WhatsApp if needed explicitly or simplify */}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="p-4">
                                                    <select
                                                        value={lead.assignedTo?._id || ''}
                                                        onChange={(e) => handleAssign(lead._id, e.target.value)}
                                                        className="text-xs border-transparent bg-transparent hover:bg-white hover:border-slate-200 rounded-lg focus:ring-indigo-500 text-slate-600 font-medium py-1 px-2 transition-all w-32 truncate"
                                                    >
                                                        <option value="">Unassigned</option>
                                                        {team.map(t => (
                                                            <option key={t._id} value={t._id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            )}
                                            <td className="p-4 text-right text-xs text-slate-400 font-medium font-mono">
                                                {format(new Date(lead.createdAt), 'MMM dd')}
                                                <br />
                                                {format(new Date(lead.createdAt), 'HH:mm')}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link to={`/leads/${lead._id}`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Details">
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </Link>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDelete(lead._id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Modals & Overlays */}
            <UserManagement
                isOpen={showTeamModal}
                onClose={() => setShowTeamModal(false)}
                onUserCreated={fetchTeam}
            />
            <AIChatWidget />
        </div>
    );
}
