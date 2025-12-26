import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorkflowById, saveWorkflowDraft, publishWorkflow, rollbackWorkflow } from '../services/api';
import { Save, UploadCloud, RotateCcw, ArrowLeft, GitCommit, GitBranch } from 'lucide-react';

import CustomConditionNode from '../components/CustomConditionNode';

// Define Custom Node Types
const nodeTypes = {
    condition: CustomConditionNode
};

export default function WorkflowBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [workflow, setWorkflow] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        loadWorkflow();
    }, [id]);

    const loadWorkflow = async () => {
        try {
            const data = await getWorkflowById(id);
            setWorkflow(data);

            // Load Draft state
            if (data.draft) {
                setNodes(data.draft.nodes || []);
                setEdges(data.draft.edges || []);
            }
        } catch (error) {
            console.error('Failed to load workflow', error);
        }
    };

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, []);

    const updateNodeData = (nodeId, newData) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: { ...node.data, ...newData } };
                }
                return node;
            })
        );
        // Also update local selected node state to reflect changes immediately in UI if needed
        setSelectedNode((prev) => prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...newData } } : prev);
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        try {
            await saveWorkflowDraft(id, { nodes, edges });
            // alert('Draft saved');
        } catch (error) {
            alert('Failed to save draft');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        try {
            await publishWorkflow(id, commitMessage);
            setShowPublishModal(false);
            setCommitMessage('');
            alert('Workflow Published & Live! 🚀');
            loadWorkflow(); // Check new version
        } catch (error) {
            alert('Publish failed');
        }
    };

    const handleRollback = async (versionId) => {
        if (!window.confirm(`Revert draft to version ${versionId}? Unsaved changes in draft will be lost.`)) return;
        try {
            await rollbackWorkflow(id, versionId);
            loadWorkflow(); // Refresh nodes
            setShowHistoryModal(false);
            alert('Time travel successful! Draft reverted.');
        } catch (error) {
            alert('Rollback failed');
        }
    };

    // Add specific node types
    const addNode = (nodeType, label) => {
        let subType = null;
        if (label.includes('Email')) subType = 'email';
        if (label.includes('WhatsApp')) subType = 'whatsapp';

        const id = `node_${Date.now()}`;
        const newNode = {
            id,
            position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
            data: {
                label: label,
                nodeType: nodeType,
                subType: subType,
                config: nodeType === 'condition' ? { field: 'leadScore', operator: '>', value: '50' } : {}
            },
            // Condition uses Custom Component, other use default styles mostly
            type: nodeType === 'condition' ? 'condition' : (nodeType === 'trigger' ? 'input' : 'default'),
            style: nodeType === 'condition' ? {} : {
                // Keep styles for non-custom nodes
                border: nodeType === 'trigger' ? '2px solid #9333ea' : '1px solid #ddd',
                background: nodeType === 'trigger' ? '#f3e8ff' : '#fff',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px',
                minWidth: '150px'
            }
        };
        setNodes((nds) => [...nds, newNode]);
    };

    if (!workflow) return <div>Loading...</div>;

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm z-10 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={() => navigate('/workflows')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-gray-800 flex flex-wrap items-center gap-2">
                            {workflow.name}
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono">DRAFT MODE</span>
                        </h1>
                        <p className="text-xs text-gray-500">
                            Active Version: <span className="font-mono text-blue-600">{workflow.activeVersionId || 'None'}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    {/* Node Toolbar */}
                    <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                        <button onClick={() => addNode('trigger', '⚡ New Lead')} className="px-3 py-1.5 text-xs font-medium hover:bg-white rounded shadow-sm text-purple-700 flex items-center gap-1">
                            ⚡ Start
                        </button>
                        <button onClick={() => addNode('action', '📧 Send Email')} className="px-3 py-1.5 text-xs font-medium hover:bg-white rounded shadow-sm text-blue-700 flex items-center gap-1">
                            📧 Email
                        </button>
                        <button onClick={() => addNode('action', '💬 WhatsApp')} className="px-3 py-1.5 text-xs font-medium hover:bg-white rounded shadow-sm text-green-700 flex items-center gap-1">
                            💬 WhatsApp
                        </button>
                        <button onClick={() => addNode('condition', '❓ Condition')} className="px-3 py-1.5 text-xs font-medium hover:bg-white rounded shadow-sm text-orange-700 flex items-center gap-1">
                            ❓ If/Else
                        </button>
                        <button onClick={() => addNode('wait', '⏳ Wait')} className="px-3 py-1.5 text-xs font-medium hover:bg-white rounded shadow-sm text-gray-700 flex items-center gap-1">
                            ⏳ Wait
                        </button>
                    </div>

                    <div className="hidden md:block h-6 w-px bg-gray-200 mx-2"></div>

                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium border md:border-none"
                    >
                        <RotateCcw className="w-4 h-4" /> History
                    </button>

                    <button
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium"
                    >
                        <Save className="w-4 h-4" /> <span className="hidden sm:inline">Save Draft</span>
                    </button>

                    <button
                        onClick={() => setShowPublishModal(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium shadow-sm"
                    >
                        <UploadCloud className="w-4 h-4" /> <span className="hidden sm:inline">Publish</span>
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 bg-gray-50 relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick} // Pass click handler
                        onPaneClick={() => setSelectedNode(null)}
                        nodeTypes={nodeTypes} // Register custom types
                        fitView
                    >
                        <Controls />
                        <MiniMap />
                        <Background gap={12} size={1} />
                    </ReactFlow>
                </div>

                {/* Configuration Sidebar */}
                {selectedNode && (
                    <div className="w-80 bg-white border-l shadow-xl p-6 overflow-y-auto z-20">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-gray-800">Configure Node</h3>
                            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Node Label</label>
                                <input
                                    type="text"
                                    value={selectedNode.data.label}
                                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                                    className="w-full border-gray-300 rounded-md text-sm"
                                />
                            </div>

                            {/* Dynamic Fields based on Node Type (using data.type stored in addNode) */}
                            {selectedNode.data.nodeType === 'action' && selectedNode.data.subType === 'email' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subject</label>
                                        <input
                                            type="text"
                                            value={selectedNode.data.config?.subject || ''}
                                            onChange={(e) => updateNodeData(selectedNode.id, { config: { ...selectedNode.data.config, subject: e.target.value } })}
                                            className="w-full border-gray-300 rounded-md text-sm"
                                            placeholder="Welcome to our service"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Message Body</label>
                                        <textarea
                                            rows={4}
                                            value={selectedNode.data.config?.body || ''}
                                            onChange={(e) => updateNodeData(selectedNode.id, { config: { ...selectedNode.data.config, body: e.target.value } })}
                                            className="w-full border-gray-300 rounded-md text-sm font-mono"
                                            placeholder="Hi {name}, thanks for joining..."
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Use {'{name}'} for dynamic variables.</p>
                                    </div>
                                </>
                            )}

                            {selectedNode.data.nodeType === 'action' && selectedNode.data.subType === 'whatsapp' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">WhatsApp Message</label>
                                    <textarea
                                        rows={4}
                                        value={selectedNode.data.config?.message || ''}
                                        onChange={(e) => updateNodeData(selectedNode.id, { config: { ...selectedNode.data.config, message: e.target.value } })}
                                        className="w-full border-gray-300 rounded-md text-sm"
                                        placeholder="Hello {name}, are you interested?"
                                    />
                                </div>
                            )}

                            {selectedNode.data.nodeType === 'wait' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Duration</label>
                                        <input
                                            type="number"
                                            value={selectedNode.data.config?.duration || 1}
                                            onChange={(e) => updateNodeData(selectedNode.id, { config: { ...selectedNode.data.config, duration: e.target.value } })}
                                            className="w-full border-gray-300 rounded-md text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Unit</label>
                                        <select
                                            value={selectedNode.data.config?.unit || 'minutes'}
                                            onChange={(e) => updateNodeData(selectedNode.id, { config: { ...selectedNode.data.config, unit: e.target.value } })}
                                            className="w-full border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="minutes">Minutes</option>
                                            <option value="hours">Hours</option>
                                            <option value="days">Days</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {selectedNode.data.nodeType === 'condition' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Evaluate Field</label>
                                        <select
                                            value={selectedNode.data.config?.field || 'leadScore'}
                                            onChange={(e) => updateNodeData(selectedNode.id, { config: { ...selectedNode.data.config, field: e.target.value } })}
                                            className="w-full border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="leadScore">Lead Score (AI)</option>
                                            <option value="status">Lead Status</option>
                                            <option value="source">Lead Source</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedNode.data.config?.operator || '>'}
                                            onChange={(e) => updateNodeData(selectedNode.id, { config: { ...selectedNode.data.config, operator: e.target.value } })}
                                            className="w-1/3 border-gray-300 rounded-md text-sm"
                                        >
                                            <option value=">">{'>'}</option>
                                            <option value="<">{'<'}</option>
                                            <option value="=">=</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={selectedNode.data.config?.value || ''}
                                            onChange={(e) => updateNodeData(selectedNode.id, { config: { ...selectedNode.data.config, value: e.target.value } })}
                                            className="flex-1 border-gray-300 rounded-md text-sm"
                                            placeholder="Value"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="pt-4 border-t mt-4">
                                <button
                                    onClick={() => {
                                        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                                        setSelectedNode(null);
                                    }}
                                    className="w-full text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-md py-2 text-sm font-medium"
                                >
                                    Delete Node
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Publish Modal */}
            {showPublishModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <GitCommit className="w-5 h-5 text-green-600" />
                            Commit Changes
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            You are about to publish this version to live. Please describe your changes.
                        </p>
                        <textarea
                            className="w-full border-gray-300 rounded-lg mb-4"
                            rows="3"
                            placeholder="e.g. Added 'Wait 5 min' step after Email"
                            value={commitMessage}
                            onChange={e => setCommitMessage(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowPublishModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                            <button onClick={handlePublish} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Commit & Publish</button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <GitBranch className="w-5 h-5 text-purple-600" />
                            Version History
                        </h2>

                        {workflow.history.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">No commits yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {workflow.history.slice().reverse().map((version) => (
                                    <div key={version.versionId} className="border p-4 rounded-lg flex justify-between items-center hover:bg-gray-50">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-sm font-bold bg-gray-100 px-2 py-0.5 rounded">
                                                    {version.versionId}
                                                </span>
                                                {version.versionId === workflow.activeVersionId && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">LIVE</span>
                                                )}
                                            </div>
                                            <p className="font-medium text-gray-800">{version.commitMessage}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(version.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRollback(version.versionId)}
                                            className="text-sm border border-gray-300 px-3 py-1.5 rounded hover:bg-white hover:border-red-300 hover:text-red-600 transition"
                                        >
                                            Rollback to this
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
