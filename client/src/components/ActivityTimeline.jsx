import React, { useMemo } from 'react';
import {
    Clock,
    MessageSquare,
    Mail,
    Phone,
    User,
    AlertCircle,
    CheckCircle,
    ArrowRight,
    Calendar,
    FileText,
    Zap
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const ActivityTimeline = ({ logs = [] }) => {

    const sortedLogs = useMemo(() => {
        return [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [logs]);

    const getIcon = (type) => {
        switch (type) {
            case 'EMAIL_SENT': return <Mail className="w-4 h-4" />;
            case 'WHATSAPP_SENT': return <MessageSquare className="w-4 h-4" />;
            case 'STATUS_CHANGE': return <ArrowRight className="w-4 h-4" />;
            case 'NOTE_ADDED': return <FileText className="w-4 h-4" />;
            case 'TASK_CREATED': return <CheckCircle className="w-4 h-4" />;
            case 'AI_ACTION': return <Zap className="w-4 h-4" />;
            case 'MANUAL_UPDATE': return <User className="w-4 h-4" />;
            case 'ERROR': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'EMAIL_SENT': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'WHATSAPP_SENT': return 'bg-green-100 text-green-600 border-green-200';
            case 'STATUS_CHANGE': return 'bg-purple-100 text-purple-600 border-purple-200';
            case 'NOTE_ADDED': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'ERROR': return 'bg-red-100 text-red-600 border-red-200';
            case 'AI_ACTION': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (logs.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6" />
                </div>
                <p className="text-slate-500 font-medium">No activity recorded yet</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Activity Timeline
            </h3>

            <div className="relative pl-4 border-l-2 border-slate-100 space-y-8">
                {sortedLogs.map((log, index) => (
                    <div key={log._id || index} className="relative">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[25px] top-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${getColor(log.type)} shadow-sm`}>
                            {getIcon(log.type)}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 group">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">
                                    {log.title || formatActivityTitle(log.type)}
                                </h4>
                                <p className="text-sm text-slate-600 mt-0.5">
                                    {log.message || log.details}
                                </p>
                                {/* Metadata chips if available */}
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {Object.entries(log.metadata).map(([key, value]) => (
                                            <span key={key} className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                                                {key}: {String(value)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="whitespace-nowrap flex flex-col items-end">
                                <span className="text-xs font-bold text-slate-500">
                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono hidden group-hover:block transition-all">
                                    {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Helper to humanize titles if missing
const formatActivityTitle = (type) => {
    return type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
};

export default ActivityTimeline;
