import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getWorkflows, createWorkflow, deleteWorkflow } from '../services/api';
import { Plus, GitBranch, Clock, PlayCircle, StopCircle, Trash2, ArrowLeft, Bot, Zap, LayoutTemplate } from 'lucide-react';
import { format } from 'date-fns';

export default function Workflows() {
    const [workflows, setWorkflows] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' });
    const navigate = useNavigate();

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        try {
            const data = await getWorkflows();
            setWorkflows(data);
        } catch (error) {
            console.error('Failed to load workflows', error);
        }
    };

    const handleDelete = async (e, id) => {
        e.preventDefault();
        if (window.confirm('Are you sure you want to delete this workflow?')) {
            try {
                await deleteWorkflow(id);
                loadWorkflows(); // Refresh list
            } catch (error) {
                alert('Failed to delete workflow');
            }
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const created = await createWorkflow(newWorkflow);
            navigate(`/workflows/${created._id}`);
        } catch (error) {
            alert('Failed to create workflow');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 z-10 sticky top-0">
                <div className="py-4 px-8 flex items-center justify-between max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                <Bot className="w-6 h-6 text-indigo-600" />
                                Automation Workflows
                            </h1>
                            <p className="text-sm text-gray-500">Build and manage your RPA bots with version control.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" /> New Bot
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8 relative">
                {/* Background decoration */}
                <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                    <div className="absolute top-20 right-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
                </div>

                {/* Workflow Grid */}
                {workflows.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 border-dashed">
                        <div className="mx-auto h-16 w-16 text-indigo-200 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                            <Bot className="h-8 w-8 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No workflows yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2 mb-6">Get started by creating your first automation bot to handle leads.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" />
                            Create First Bot
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workflows.map(workflow => (
                            <div key={workflow._id} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 relative overflow-hidden">
                                {/* Decor bar */}
                                <div className={`absolute top-0 left-0 w-full h-1 ${workflow.isActive ? 'bg-green-500' : 'bg-gray-200'}`}></div>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-lg ${workflow.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {workflow.isActive ? <Zap className="w-5 h-5 fill-current" /> : <Bot className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${workflow.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {workflow.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleDelete(e, workflow._id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete Workflow"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-lg text-gray-900 mb-1 leading-tight group-hover:text-indigo-600 transition-colors">
                                    {workflow.name}
                                </h3>
                                <p className="text-sm text-gray-500 mb-6 line-clamp-2 h-10">
                                    {workflow.description || 'No description provided.'}
                                </p>

                                <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5" title="Active Version">
                                        <GitBranch className="w-3.5 h-3.5" />
                                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">
                                            {workflow.activeVersionId || 'v0.1'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {format(new Date(workflow.updatedAt), 'MMM dd')}
                                    </div>
                                </div>

                                <Link
                                    to={`/workflows/${workflow._id}`}
                                    className="absolute inset-0 z-0"
                                    aria-label={`Edit ${workflow.name}`}
                                ></Link>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <LayoutTemplate className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Create New Bot</h2>
                                    <p className="text-sm text-gray-500">Define the purpose of your automation.</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreate}>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Bot Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        value={newWorkflow.name}
                                        onChange={e => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                                        placeholder="e.g., Lead Qualifier 3000"
                                        autoFocus
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
                                    <textarea
                                        className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        rows="3"
                                        value={newWorkflow.description}
                                        onChange={e => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                                        placeholder="What is this bot responsible for?"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md font-medium text-sm transition flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Create & Build
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
