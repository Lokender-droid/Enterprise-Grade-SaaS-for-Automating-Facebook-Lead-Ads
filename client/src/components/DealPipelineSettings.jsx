import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown, GripVertical, Check, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStages, createStage, updateStage, deleteStage, reorderStages } from '../services/api';

const COLORS = [
    '#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
];

const DealPipelineSettings = () => {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        color: COLORS[0],
        probability: 0,
        autoActions: {
            createTask: { enabled: false, taskTitle: 'Follow up', dueInDays: 1 },
            assignTo: { enabled: false }
        }
    });

    useEffect(() => {
        fetchStages();
    }, []);

    const fetchStages = async () => {
        try {
            const data = await getStages();
            setStages(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (stage = null) => {
        if (stage) {
            setEditingStage(stage);
            setFormData({
                name: stage.name,
                color: stage.color || COLORS[0],
                probability: stage.probability,
                autoActions: stage.autoActions || { createTask: { enabled: false, taskTitle: 'Follow up', dueInDays: 1 }, assignTo: { enabled: false } }
            });
        } else {
            setEditingStage(null);
            setFormData({
                name: '',
                color: COLORS[0],
                probability: 10,
                autoActions: { createTask: { enabled: false, taskTitle: 'Follow up', dueInDays: 1 }, assignTo: { enabled: false } }
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingStage) {
                await updateStage(editingStage._id, formData);
            } else {
                await createStage(formData);
            }
            setIsModalOpen(false);
            fetchStages();
        } catch (err) {
            alert('Failed to save stage');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this stage? Leads in this stage must be moved strictly.')) return;
        try {
            await deleteStage(id);
            fetchStages();
        } catch (err) {
            alert('Failed to delete stage');
        }
    };

    const handleReorder = async (index, direction) => {
        const newStages = [...stages];
        if (direction === 'up' && index > 0) {
            [newStages[index], newStages[index - 1]] = [newStages[index - 1], newStages[index]];
        } else if (direction === 'down' && index < newStages.length - 1) {
            [newStages[index], newStages[index + 1]] = [newStages[index + 1], newStages[index]];
        } else {
            return;
        }

        setStages(newStages);
        const orders = newStages.map((s, i) => ({ stageId: s._id, displayOrder: i }));
        try {
            await reorderStages(orders);
        } catch (err) {
            fetchStages();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Deal Pipeline</h3>
                    <p className="text-sm text-gray-500">Configure stages for your sales process.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                    <Plus className="inline w-4 h-4 mr-2" /> Add Stage
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex text-xs font-semibold text-gray-500 uppercase">
                    <div className="w-12 text-center">Color</div>
                    <div className="flex-1 px-4">Stage Name</div>
                    <div className="w-24 text-center">Prob %</div>
                    <div className="w-32 text-center">Actions</div>
                </div>
                <div className="divide-y divide-gray-100">
                    <AnimatePresence>
                        {stages.map((stage, idx) => (
                            <motion.div
                                key={stage._id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center p-4 hover:bg-gray-50 group"
                            >
                                <div className="w-12 flex justify-center">
                                    <div className="w-4 h-4 rounded-full shadow-sm ring-1 ring-inset ring-black/10" style={{ backgroundColor: stage.color }}></div>
                                </div>
                                <div className="flex-1 px-4 font-medium text-gray-900">{stage.name}</div>
                                <div className="w-24 text-center text-gray-500">{stage.probability}%</div>
                                <div className="w-32 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleReorder(idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowUp size={14} /></button>
                                    <button onClick={() => handleReorder(idx, 'down')} disabled={idx === stages.length - 1} className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowDown size={14} /></button>
                                    <div className="w-px h-4 bg-gray-300 mx-1 self-center"></div>
                                    <button onClick={() => handleOpenModal(stage)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                                    {!stage.isDefault ? (
                                        <button onClick={() => handleDelete(stage._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                    ) : (
                                        <div className="w-7"></div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg">{editingStage ? 'Edit Stage' : 'New Stage'}</h3>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Stage Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Probability (%)</label>
                                        <input type="number" min="0" max="100" value={formData.probability} onChange={e => setFormData({ ...formData, probability: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Color</label>
                                        <div className="flex gap-2">
                                            {COLORS.slice(0, 4).map(c => (
                                                <button type="button" key={c} onClick={() => setFormData({ ...formData, color: c })} className={`w-6 h-6 rounded-full ${formData.color === c ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`} style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <label className="flex items-center gap-2 mb-2 font-medium text-sm">
                                        <input type="checkbox" checked={formData.autoActions.createTask.enabled} onChange={e => setFormData({ ...formData, autoActions: { ...formData.autoActions, createTask: { ...formData.autoActions.createTask, enabled: e.target.checked } } })} />
                                        Auto-create Task
                                    </label>
                                    {formData.autoActions.createTask.enabled && (
                                        <div className="pl-6 space-y-2">
                                            <input type="text" value={formData.autoActions.createTask.taskTitle} onChange={e => setFormData({ ...formData, autoActions: { ...formData.autoActions, createTask: { ...formData.autoActions.createTask, taskTitle: e.target.value } } })} className="w-full px-3 py-2 border rounded text-sm" placeholder="Task Title" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DealPipelineSettings;
