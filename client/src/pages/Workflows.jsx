import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getWorkflows, createWorkflow, deleteWorkflow } from '../services/api';
import { Plus, GitBranch, ArrowRight, Clock, PlayCircle, StopCircle, Trash2 } from 'lucide-react';
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Automation Workflows</h1>
                        <p className="text-gray-500">Build and manage your RPA bots with version control.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Plus className="w-4 h-4" /> New Workflow
                    </button>
                </div>

                {/* Workflow Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {workflows.map(workflow => (
                        <div key={workflow._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-lg ${workflow.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    {workflow.isActive ? <PlayCircle className="w-6 h-6 text-green-600" /> : <StopCircle className="w-6 h-6 text-gray-500" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                        {workflow.activeVersionId ? `v.${workflow.activeVersionId}` : 'DRAFT'}
                                    </span>
                                    <button
                                        onClick={(e) => handleDelete(e, workflow._id)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                        title="Delete Workflow"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-gray-800 mb-2">{workflow.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{workflow.description || 'No description'}</p>

                            <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(workflow.updatedAt), 'MMM dd, HH:mm')}
                                </div>
                                <div className="flex items-center gap-1">
                                    <GitBranch className="w-3 h-3" />
                                    Git-Style VC
                                </div>
                            </div>

                            <Link
                                to={`/workflows/${workflow._id}`}
                                className="w-full block text-center bg-gray-50 text-blue-600 font-medium py-2 rounded-lg hover:bg-blue-50 transition"
                            >
                                Edit Workflow
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <h2 className="text-lg font-bold mb-4">Create New Bot</h2>
                            <form onSubmit={handleCreate}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border-gray-300 rounded-lg"
                                        value={newWorkflow.name}
                                        onChange={e => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                                        placeholder="e.g., Auto Lead Qualification"
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        className="w-full border-gray-300 rounded-lg"
                                        value={newWorkflow.description}
                                        onChange={e => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                                        placeholder="What does this bot do?"
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Create & Build
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
