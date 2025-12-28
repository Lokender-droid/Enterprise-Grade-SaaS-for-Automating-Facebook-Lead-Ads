import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown, Check, X, MoveHorizontal, Type, List, ToggleLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomFields, createCustomField, updateCustomField, deleteCustomField, reorderCustomFields } from '../services/api';

const FIELD_TYPES = [
    { value: 'text', label: 'Text', icon: Type },
    { value: 'number', label: 'Number', icon: List },
    { value: 'date', label: 'Date', icon: List },
    { value: 'boolean', label: 'Checkbox (True/False)', icon: ToggleLeft },
    { value: 'select', label: 'Select (Dropdown)', icon: List },
    { value: 'multiselect', label: 'Multi-Select', icon: List },
    { value: 'email', label: 'Email', icon: Type },
    { value: 'phone', label: 'Phone', icon: Type },
    { value: 'url', label: 'URL', icon: Type },
    { value: 'textarea', label: 'Long Text', icon: Type },
];

const CustomFieldsSettings = () => {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingField, setEditingField] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        label: '',
        key: '',
        type: 'text',
        placeholder: '',
        options: [], // For select/multiselect
        validation: {
            required: false,
            unique: false
        },
        displayOrder: 0
    });
    const [optionInput, setOptionInput] = useState('');

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
        try {
            const data = await getCustomFields();
            setFields(data.sort((a, b) => a.displayOrder - b.displayOrder));
        } catch (err) {
            setError('Failed to load custom fields');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (field = null) => {
        if (field) {
            setEditingField(field);
            setFormData({
                label: field.label,
                key: field.key,
                type: field.type,
                placeholder: field.placeholder || '',
                options: field.options || [],
                validation: field.validation || { required: false, unique: false },
                displayOrder: field.displayOrder
            });
        } else {
            setEditingField(null);
            setFormData({
                label: '',
                key: '',
                type: 'text',
                placeholder: '',
                options: [],
                validation: { required: false, unique: false },
                displayOrder: fields.length
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingField) {
                await updateCustomField(editingField._id, formData);
            } else {
                await createCustomField(formData);
            }
            setIsModalOpen(false);
            fetchFields();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save field');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This will remove data for this field from all leads.')) return;
        try {
            await deleteCustomField(id);
            fetchFields();
        } catch (err) {
            alert('Failed to delete field');
        }
    };

    const handleReorder = async (index, direction) => {
        const newFields = [...fields];
        if (direction === 'up' && index > 0) {
            [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
        } else if (direction === 'down' && index < newFields.length - 1) {
            [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
        } else {
            return;
        }

        setFields(newFields); // Optimistic update

        const orders = newFields.map((f, i) => ({ fieldId: f._id, displayOrder: i }));
        try {
            await reorderCustomFields(orders);
        } catch (err) {
            fetchFields(); // Revert on error
            console.error(err);
        }
    };

    const handleAddOption = () => {
        if (optionInput.trim()) {
            setFormData({ ...formData, options: [...formData.options, optionInput.trim()] });
            setOptionInput('');
        }
    };

    const removeOption = (idx) => {
        const newOpts = [...formData.options];
        newOpts.splice(idx, 1);
        setFormData({ ...formData, options: newOpts });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Custom Fields</h3>
                    <p className="text-sm text-gray-500">Collect specific data for your business by adding custom fields to leads.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Add Field
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading fields...</div>
            ) : fields.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">No custom fields yet.</p>
                    <button onClick={() => handleOpenModal()} className="mt-4 text-indigo-600 font-medium hover:underline">Add your first field</button>
                </div>
            ) : (
                <div className="bg-white border boundary-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">Label</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Key</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <AnimatePresence>
                                    {fields.map((field, idx) => (
                                        <motion.tr
                                            key={field._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            layout
                                            className="group hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    {field.type === 'boolean' ? <ToggleLeft size={16} /> : <Type size={16} />}
                                                </span>
                                                {field.label}
                                                {field.validation?.required && <span className="text-red-500 text-xs ml-1">*</span>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 capitalize">{field.type}</td>
                                            <td className="px-6 py-4 text-gray-400 font-mono text-xs">{field.key}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleReorder(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowUp size={16} /></button>
                                                    <button onClick={() => handleReorder(idx, 'down')} disabled={idx === fields.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowDown size={16} /></button>
                                                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                                    <button onClick={() => handleOpenModal(field)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDelete(field._id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg text-gray-900">{editingField ? 'Edit Field' : 'New Custom Field'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Field Label <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., Budget, Industry"
                                    />
                                    {!editingField && formData.label && (
                                        <p className="text-xs text-gray-400 mt-1">Generated Key: {formData.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {FIELD_TYPES.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                                        <input
                                            type="text"
                                            value={formData.placeholder}
                                            onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Helper text..."
                                        />
                                    </div>
                                </div>

                                {/* Options for Select/MultiSelect */}
                                {(formData.type === 'select' || formData.type === 'multiselect') && (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Options</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={optionInput}
                                                onChange={(e) => setOptionInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
                                                placeholder="Add option..."
                                            />
                                            <button type="button" onClick={handleAddOption} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"><Plus size={16} /></button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.options.map((opt, i) => (
                                                <span key={i} className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded text-sm text-gray-700">
                                                    {opt}
                                                    <button type="button" onClick={() => removeOption(i)} className="ml-1 text-gray-400 hover:text-red-500"><X size={12} /></button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-6 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.validation.required}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                validation: { ...formData.validation, required: e.target.checked }
                                            })}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">Required Field</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.validation.unique}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                validation: { ...formData.validation, unique: e.target.checked }
                                            })}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">Unique Values</span>
                                    </label>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
                                    >
                                        {editingField ? 'Save Changes' : 'Create Field'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomFieldsSettings;
