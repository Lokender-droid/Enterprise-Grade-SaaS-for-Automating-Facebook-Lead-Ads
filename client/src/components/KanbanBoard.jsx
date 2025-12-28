import React, { useState, useEffect } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { updateLeadStage } from '../services/api';
import { format } from 'date-fns';
import {
    MoreHorizontal,
    Calendar,
    User,
    DollarSign,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const KanbanCard = ({ lead, stageColor }) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={lead}
            id={lead._id}
            dragListener={true}
            dragControls={controls}
            whileDrag={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative"
        >
            <div className="flex justify-between items-start mb-2">
                <Link to={`/leads/${lead._id}`} className="font-bold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-1">
                    {lead.name}
                </Link>
                <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: stageColor }}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center text-xs text-slate-500">
                    <User className="w-3 h-3 mr-1.5 opacity-70" />
                    <span className="truncate">{lead.companyName || 'No Company'}</span>
                </div>

                {lead.value > 0 && (
                    <div className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                        <DollarSign className="w-3 h-3 mr-0.5" />
                        {lead.value.toLocaleString()}
                    </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(lead.createdAt), 'MMM d')}
                    </div>
                    {lead.leadScore && (
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${lead.leadScore > 70 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>
                            {lead.leadScore}
                        </div>
                    )}
                </div>
            </div>
        </Reorder.Item>
    );
};

const KanbanColumn = ({ stage, leads, onMoveLead }) => {
    return (
        <div className="flex flex-col min-w-[280px] w-[280px] bg-slate-50/50 rounded-2xl border border-slate-200/60 max-h-full">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
                        style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-bold text-slate-700 text-sm truncate max-w-[140px]">
                        {stage.name}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-400 border border-slate-100 shadow-sm">
                        {leads.length}
                    </span>
                    <button className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Droppable Area */}
            <Reorder.Group
                axis="y"
                values={leads}
                onReorder={(newOrder) => {
                    // This is triggered when reordering inside the same list
                    // For Kanban, we typically handle drag end event or use specific dnd library logic
                    // With Framer Motion Reorder, cross-list drag is tricky.
                    // For MVP simplicity, we might emulate 'drag to move' or stick to Reorder within lists.
                    // Wait, Reorder is primarily for sorting.
                    // For Kanban moving between columns, we need 'onDragEnd' and checking position or 'LayoutGroup'.
                    // Actually, for robust Kanban, 'dnd-kit' or 'react-beautiful-dnd' is better.
                    // Since I chose Framer Motion, I will implement a simpler 'Click to Move' or 'Drag' visual.
                    // BUT, to keep it simple and reliable given the instructions, I might implement Reorder per list
                    // AND provide a 'Move' dropdown on the card as a fallback if drag is complex.
                    // However, users expect Drag and Drop.
                    // Let's rely on standard Framer Motion LayoutGroup for shared layout animations 
                    // and maybe simple HTML5 DnD for the actual cross-column move if Reorder is too strict.
                    // Let's try to utilize standard HTML5 DnD wrapping the Framer Motion card for simplicity and robustness.
                }}
                className="flex-1 p-3 overflow-y-auto min-h-[100px]"
            >
                {leads.map(lead => (
                    <KanbanCard key={lead._id} lead={lead} stageColor={stage.color} />
                ))}
            </Reorder.Group>

            {/* Footer Summary */}
            <div className="p-3 border-t border-slate-100 text-xs text-slate-400 font-medium text-center">
                {leads.reduce((sum, l) => sum + (l.value || 0), 0) > 0 && (
                    <span>Total: ${leads.reduce((sum, l) => sum + (l.value || 0), 0).toLocaleString()}</span>
                )}
            </div>
        </div>
    );
};

// Re-implementing with HTML5 DnD for reliable cross-column dragging
// Framer Motion Reorder is great for 1 dimension, but 2D Kanban is harder.
const DraggableCard = ({ lead, stageColor, onDragStart }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, lead)}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-1 transition-all group relative animate-in fade-in zoom-in duration-300"
        >
            <div className="flex justify-between items-start mb-2">
                <Link to={`/leads/${lead._id}`} className="font-bold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-1 text-sm">
                    {lead.name}
                </Link>
                <div
                    className="w-2 h-2 rounded-full ring-1 ring-slate-100"
                    style={{ backgroundColor: stageColor }}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center text-xs text-slate-500">
                    <User className="w-3 h-3 mr-1.5 opacity-70" />
                    <span className="truncate max-w-[150px]">{lead.companyName || 'No Company'}</span>
                </div>

                {lead.value > 0 && (
                    <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full w-fit">
                        <DollarSign className="w-3 h-3 mr-0.5" />
                        {lead.value.toLocaleString()}
                    </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(lead.createdAt), 'MMM d')}
                    </div>
                    {lead.leadScore && (
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${lead.leadScore > 70 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>
                            {lead.leadScore} AI
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DroppableColumn = ({ stage, leads, onDrop, onDragStart }) => {
    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-indigo-50/50', 'ring-2', 'ring-indigo-200');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('bg-indigo-50/50', 'ring-2', 'ring-indigo-200');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-indigo-50/50', 'ring-2', 'ring-indigo-200');
        onDrop(stage._id);
    };

    return (
        <div
            className="flex flex-col min-w-[280px] w-[280px] bg-slate-50/80 rounded-2xl border border-slate-200 max-h-[calc(100vh-240px)] transition-all"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100/50 sticky top-0 bg-slate-50/80 backdrop-blur-sm rounded-t-2xl z-10">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
                        style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-bold text-slate-700 text-sm truncate max-w-[140px]">
                        {stage.name}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-400 border border-slate-100 shadow-sm">
                        {leads.length}
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                {leads.map(lead => (
                    <DraggableCard
                        key={lead._id}
                        lead={lead}
                        stageColor={stage.color}
                        onDragStart={onDragStart}
                    />
                ))}
                {leads.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-300 font-medium italic">
                        Drop items here
                    </div>
                )}
            </div>

            {/* Footer Summary */}
            <div className="p-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium text-center uppercase tracking-wider">
                {leads.reduce((sum, l) => sum + (l.value || 0), 0) > 0 ? (
                    <span>Est. Value: ${leads.reduce((sum, l) => sum + (l.value || 0), 0).toLocaleString()}</span>
                ) : (
                    <span>-</span>
                )}
            </div>
        </div>
    );
};

export default function KanbanBoard({ leads, stages, onLeadUpdate }) {
    const [draggedLead, setDraggedLead] = useState(null);

    const handleDragStart = (e, lead) => {
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = "move";
        // e.dataTransfer.setDragImage(img, 0, 0); // Optional: Set custom drag image
    };

    const handleDrop = async (targetStageId) => {
        if (!draggedLead) return;

        // Find if target stage is different
        // In this implementation, we assume lead.stage is populated with { _id, ... } or just ID
        const currentStageId = draggedLead.stage?._id || draggedLead.stage;

        if (currentStageId !== targetStageId) {
            try {
                // Optimistic Update handled by parent if needed, 
                // but for now we just trigger the update and let parent refresh
                await updateLeadStage(draggedLead._id, targetStageId);
                if (onLeadUpdate) onLeadUpdate();
            } catch (error) {
                console.error("Failed to move lead", error);
                alert("Failed to move lead. Please try again.");
            }
        }
        setDraggedLead(null);
    };

    // Group leads by stage
    // Ensure stages are sorted by order
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);

    // Map leads to stage IDs for easy lookup
    const leadsByStage = sortedStages.reduce((acc, stage) => {
        acc[stage._id] = [];
        return acc;
    }, {});

    // Bucket leads
    // Note: Some leads might not have a stage or valid stage. 
    // We should probably have a 'Unassigned' or fallback specific 'New' stage if logical.
    // For now we assume leads link to valid stages or we rely on 'status' field mapping
    // But since we are moving to Pipeline model, leads should have 'stage' field.
    // However, existing leads might only have 'status'. 
    // We need to map 'status' (New, Contacted, etc.) to Stages if 'stage' ID is missing.
    // This mapping logic should ideally happen in backend, but for display:

    leads.forEach(lead => {
        const stageId = lead.stage?._id || lead.stage;
        if (stageId && leadsByStage[stageId]) {
            leadsByStage[stageId].push(lead);
        } else {
            // If lead has legacy 'status', try to map to stage name
            const matchingStage = sortedStages.find(s => s.name.toLowerCase() === (lead.status || '').toLowerCase());
            if (matchingStage) {
                leadsByStage[matchingStage._id].push(lead);
            } else {
                // Fallback: put in first stage or a dedicated 'Uncategorized' bucket?
                // Let's put in the first stage available (typically 'New Lead')
                if (sortedStages.length > 0) {
                    leadsByStage[sortedStages[0]._id].push(lead);
                }
            }
        }
    });

    return (
        <div className="flex h-full overflow-x-auto gap-4 p-4 pb-8 min-h-[500px]">
            {sortedStages.map(stage => (
                <DroppableColumn
                    key={stage._id}
                    stage={stage}
                    leads={leadsByStage[stage._id]}
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                />
            ))}
        </div>
    );
}
