import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Circle,
    Clock,
    Calendar,
    User,
    Plus,
    Filter,
    MoreHorizontal,
    AlertCircle,
    Search,
    Trash2
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns';
import { getTasks, getTasksByLead, createTask, updateTask, completeTask, deleteTask, getTeam } from '../services/api';

const TaskModal = ({ isOpen, onClose, onSave, leadId, team = [] }) => {
    const [task, setTask] = useState({
        title: '',
        type: 'follow-up',
        priority: 'medium',
        dueDate: format(addDays(new Date(), 1), 'yyyy-MM-ddccHH:mm'), // Default tomorrow
        description: '',
        assignedTo: '',
        lead: leadId || ''
    });

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setTask(prev => ({
                ...prev,
                lead: leadId || prev.lead,
                assignedTo: prev.assignedTo || '' // Keep previous assignment if any, or default
            }));
        }
    }, [isOpen, leadId]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(task);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">Create New Task</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="sr-only">Close</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Follow up on proposal"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold"
                            value={task.title}
                            onChange={e => setTask({ ...task, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                value={task.type}
                                onChange={e => setTask({ ...task, type: e.target.value })}
                            >
                                <option value="call">Call</option>
                                <option value="email">Email</option>
                                <option value="meeting">Meeting</option>
                                <option value="follow-up">Follow-up</option>
                                <option value="demo">Demo</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                value={task.priority}
                                onChange={e => setTask({ ...task, priority: e.target.value })}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                value={task.dueDate}
                                onChange={e => setTask({ ...task, dueDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                value={task.assignedTo}
                                onChange={e => setTask({ ...task, assignedTo: e.target.value })}
                            >
                                <option value="">Me</option>
                                {team.map(u => (
                                    <option key={u._id} value={u._id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm min-h-[80px]"
                            placeholder="Add details..."
                            value={task.description}
                            onChange={e => setTask({ ...task, description: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                        >
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function TaskManager({ leadId, compact = false }) {
    const [tasks, setTasks] = useState([]);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'open', 'completed'
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchTasks();
        fetchTeamData();
    }, [leadId]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = leadId ? await getTasksByLead(leadId) : await getTasks();
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamData = async () => {
        try {
            const data = await getTeam();
            setTeam(data);
        } catch (e) {
            console.error("Failed to fetch team", e);
        }
    };

    const handleCreateTask = async (taskData) => {
        try {
            await createTask(taskData);
            setIsModalOpen(false);
            fetchTasks();
        } catch (error) {
            console.error("Failed to create task", error);
            alert("Error creating task");
        }
    };

    const handleToggleComplete = async (task) => {
        // Optimistic update
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));

        try {
            await completeTask(task._id);
            // Verify sync
            // fetchTasks(); 
        } catch (error) {
            console.error("Failed to update task", error);
            setTasks(prev => prev.map(t => t._id === task._id ? task : t)); // Revert
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await deleteTask(id);
            setTasks(prev => prev.filter(t => t._id !== id));
        } catch (error) {
            console.error("Failed to delete task", error);
        }
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === 'completed') return t.status === 'completed';
        if (filter === 'open') return t.status !== 'completed';
        return true;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)); // Sort by due date

    // Date formatting helper
    const getDueDateLabel = (date) => {
        const d = new Date(date);
        if (isToday(d)) return <span className="text-orange-600 font-bold">Today</span>;
        if (isTomorrow(d)) return <span className="text-blue-600">Tomorrow</span>;
        if (isPast(d)) return <span className="text-red-600 font-bold">Overdue</span>;
        return <span className="text-gray-500">{format(d, 'MMM d')}</span>;
    };

    return (
        <div className={`bg-white rounded-xl ${compact ? '' : 'shadow-sm border border-gray-200'} h-full flex flex-col`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-gray-800">{compact ? 'Tasks' : 'Task Manager'}</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                        {tasks.filter(t => t.status !== 'completed').length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!compact && (
                        <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
                            {['all', 'open', 'completed'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${filter === f ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        title="Add Task"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className={`flex-1 overflow-y-auto p-0 ${compact ? 'max-h-[300px]' : ''}`}>
                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading tasks...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                        <CheckCircle2 className="w-8 h-8 opacity-20 mb-2" />
                        <p>No tasks found.</p>
                        <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-medium mt-1 hover:underline">
                            Create a task
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredTasks.map(task => (
                            <div key={task._id} className="p-4 hover:bg-slate-50 transition-colors group flex gap-3 items-start">
                                <button
                                    onClick={() => handleToggleComplete(task)}
                                    className={`mt-1 flex-shrink-0 transition-colors ${task.status === 'completed'
                                            ? 'text-green-500'
                                            : 'text-gray-300 hover:text-indigo-500'
                                        }`}
                                >
                                    {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className={`text-sm font-semibold truncate pr-2 ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {task.title}
                                        </p>
                                        <button
                                            onClick={() => handleDelete(task._id)}
                                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center text-xs">
                                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                            {getDueDateLabel(task.dueDate)}
                                        </div>
                                        {task.priority !== 'medium' && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                    task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        )}
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded capitalize">
                                            {task.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreateTask}
                leadId={leadId}
                team={team}
            />
        </div>
    );
}
