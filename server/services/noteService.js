const Note = require('../models/Note');
const Activity = require('../models/Activity');

class NoteService {
    /**
     * Create a new note
     */
    async createNote(noteData, createdBy) {
        try {
            const note = await Note.create({
                organizationId: noteData.organizationId,
                leadId: noteData.leadId,
                content: noteData.content,
                createdBy,
                mentions: noteData.mentions || [],
                type: noteData.type || 'general',
                isPrivate: noteData.isPrivate || false,
                attachments: noteData.attachments || [],
                isPinned: noteData.isPinned || false
            });

            // Log activity
            await Activity.create({
                organizationId: noteData.organizationId,
                leadId: noteData.leadId,
                type: 'note_added',
                title: 'Note added',
                description: `Added note`,
                performedBy: createdBy,
                performedByType: 'user',
                relatedNoteId: note._id,
                metadata: {
                    noteType: note.type,
                    isPrivate: note.isPrivate
                }
            });

            return await note.populate('createdBy mentions', 'name email');
        } catch (error) {
            console.error('Error creating note:', error);
            throw error;
        }
    }

    /**
     * Get notes for a lead
     */
    async getNotes(organizationId, leadId, userId) {
        try {
            const query = {
                organizationId,
                leadId,
                // Visibility logic: Public notes OR private notes created by user
                $or: [
                    { isPrivate: false },
                    { isPrivate: true, createdBy: userId }
                ]
            };

            const notes = await Note.find(query)
                .populate('createdBy mentions', 'name email')
                .sort({ isPinned: -1, createdAt: -1 })
                .lean();

            return notes;
        } catch (error) {
            console.error('Error getting notes:', error);
            throw error;
        }
    }

    /**
     * Update a note
     */
    async updateNote(organizationId, noteId, updates, updatedBy) {
        try {
            const note = await Note.findOne({ _id: noteId, organizationId });

            if (!note) {
                throw new Error('Note not found');
            }

            // Only creator can edit content
            if (note.createdBy.toString() !== updatedBy.toString()) {
                // Check if user is admin (optional logic based on requirements)
                // For now strict ownership
                throw new Error('Permission denied');
            }

            const allowedUpdates = [
                'content', 'mentions', 'type', 'isPrivate', 'isPinned', 'attachments'
            ];

            allowedUpdates.forEach(key => {
                if (updates[key] !== undefined) {
                    note[key] = updates[key];
                }
            });

            note.updatedAt = new Date();
            await note.save();

            return await note.populate('createdBy mentions');
        } catch (error) {
            console.error('Error updating note:', error);
            throw error;
        }
    }

    /**
     * Delete a note
     */
    async deleteNote(organizationId, noteId, deletedBy) {
        try {
            const note = await Note.findOne({ _id: noteId, organizationId });

            if (!note) {
                throw new Error('Note not found');
            }

            if (note.createdBy.toString() !== deletedBy.toString()) {
                throw new Error('Permission denied');
            }

            await Note.deleteOne({ _id: noteId });

            return { success: true, message: 'Note deleted successfully' };
        } catch (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    }
}

module.exports = new NoteService();
