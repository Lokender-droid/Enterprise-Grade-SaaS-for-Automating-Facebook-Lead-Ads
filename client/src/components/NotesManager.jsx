import React, { useState, useEffect } from 'react';
import {
    StickyNote,
    Plus,
    MoreHorizontal,
    Trash2,
    Paperclip,
    Send
} from 'lucide-react';
import { format } from 'date-fns';
import { getNotesByLead, createNote, deleteNote } from '../services/api';

export default function NotesManager({ leadId }) {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (leadId) fetchNotes();
    }, [leadId]);

    const fetchNotes = async () => {
        try {
            const data = await getNotesByLead(leadId);
            setNotes(data);
        } catch (error) {
            console.error("Failed to fetch notes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        try {
            const noteData = {
                content: newNote,
                lead: leadId,
                type: 'general',
                isPrivate: false
            };
            const created = await createNote(noteData);
            setNotes(prev => [created, ...prev]);
            setNewNote('');
        } catch (error) {
            console.error("Failed to create note", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this note?")) return;
        try {
            await deleteNote(id);
            setNotes(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            console.error("Failed to delete note", error);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-bold text-gray-800">Notes</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                        {notes.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                {loading ? (
                    <div className="text-center text-gray-400 text-sm">Loading notes...</div>
                ) : notes.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8 italic">
                        No notes yet. Add one below.
                    </div>
                ) : (
                    notes.map(note => (
                        <div key={note._id} className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 group relative">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                        {note.createdBy?.name?.charAt(0) || 'U'}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{note.createdBy?.name || 'User'}</span>
                                    <span className="text-[10px] text-gray-400">{format(new Date(note.createdAt), 'MMM d, p')}</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(note._id)}
                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleCreateNote} className="p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                <div className="relative">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Write a note... (Shift+Enter for new line)"
                        className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none shadow-sm"
                        rows={2}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                        {/* <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <Paperclip className="w-4 h-4" />
                        </button> */}
                        <button
                            type="submit"
                            disabled={!newNote.trim()}
                            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
