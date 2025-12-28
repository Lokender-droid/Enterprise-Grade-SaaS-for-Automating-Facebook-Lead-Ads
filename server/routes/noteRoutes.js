const express = require('express');
const router = express.Router();
const noteService = require('../services/noteService');

const authController = require('../controllers/authController');

// Create note
router.post('/', authController.protect, async (req, res) => {
    try {
        const noteData = {
            ...req.body,
            organizationId: req.user.organizationId
        };
        const note = await noteService.createNote(noteData, req.user._id);
        res.status(201).json(note);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get notes for a lead
router.get('/lead/:leadId', authController.protect, async (req, res) => {
    try {
        const notes = await noteService.getNotes(
            req.user.organizationId,
            req.params.leadId,
            req.user._id
        );
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update note
router.put('/:id', authController.protect, async (req, res) => {
    try {
        const note = await noteService.updateNote(
            req.user.organizationId,
            req.params.id,
            req.body,
            req.user._id
        );
        res.json(note);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete note
router.delete('/:id', authController.protect, async (req, res) => {
    try {
        const result = await noteService.deleteNote(
            req.user.organizationId,
            req.params.id,
            req.user._id
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
