import React, { useState, useEffect } from 'react';
import { getTeam, inviteMember, getInvitations, revokeInvitation, deleteUser } from '../services/api';
import { Trash2, UserPlus, Shield, User, Users, X, Mail, Clock } from 'lucide-react';

export default function UserManagement({ isOpen, onClose, onUserCreated }) {
    const [team, setTeam] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', role: 'agent' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            const [teamData, invitesData] = await Promise.all([getTeam(), getInvitations()]);
            setTeam(teamData);
            setInvitations(invitesData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await inviteMember(inviteData);
            setInviteData({ email: '', role: 'agent' });
            fetchData();
            setSuccess('Invitation sent successfully! The mock link is in the console for now.');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to send invitation';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id) => {
        if (!window.confirm('Are you sure you want to revoke this invitation?')) return;
        try {
            await revokeInvitation(id);
            fetchData();
        } catch (err) {
            alert('Failed to revoke invitation');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this team member?')) return;
        try {
            await deleteUser(id);
            fetchData();
            onUserCreated(); // Refresh dashboard stats/assigned options
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="w-5 h-5" /> Team Management
                    </h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Invite User Form */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Invite New Member
                        </h3>
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4 border border-red-100">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg text-sm mb-4 border border-green-100">
                                {success}
                            </div>
                        )}
                        <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <input
                                    placeholder="Email Address"
                                    type="email"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={inviteData.email}
                                    onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 bg-white"
                                    value={inviteData.role}
                                    onChange={e => setInviteData({ ...inviteData, role: e.target.value })}
                                >
                                    <option value="agent">Agent</option>
                                    <option value="manager">Manager</option>
                                </select>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                                >
                                    {loading ? '...' : 'Invite'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Pending Invitations */}
                    {invitations.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Pending Invitations
                            </h3>
                            <div className="space-y-3">
                                {invitations.map(invite => (
                                    <div key={invite._id} className="flex justify-between items-center p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-yellow-100/50 rounded-full flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-yellow-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{invite.email}</p>
                                                <p className="text-xs text-gray-500 uppercase">Role: {invite.role}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRevoke(invite._id)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Team List */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Team Members
                        </h3>
                        <div className="space-y-3">
                            {team.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">No active team members yet.</p>
                            ) : (
                                team.map(member => (
                                    <div key={member._id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition gap-4">
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                                                {member.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-semibold text-gray-900 truncate">{member.name} {member.role === 'admin' ? '(You)' : ''}</h4>
                                                <p className="text-sm text-gray-500 truncate">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full uppercase tracking-wide ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                    member.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {member.role || 'Admin'}
                                            </span>
                                            {member.role !== 'admin' && ( // Cannot delete self/other admins easily here without more checks
                                                <button
                                                    onClick={() => handleDelete(member._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Remove Member"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
