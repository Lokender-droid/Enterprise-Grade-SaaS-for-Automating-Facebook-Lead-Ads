const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');

const authController = require('../controllers/authController');

// Create task
router.post('/', authController.protect, async (req, res) => {
    try {
        const taskData = {
            ...req.body,
            organizationId: req.user.organizationId
        };
        const task = await taskService.createTask(taskData, req.user._id, req.io);
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get tasks
router.get('/', authController.protect, async (req, res) => {
    try {
        const tasks = await taskService.getTasks(
            req.user.organizationId,
            req.query
        );
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single task
router.get('/:id', authController.protect, async (req, res) => {
    try {
        const task = await taskService.getTask(
            req.user.organizationId,
            req.params.id
        );
        res.json(task);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Update task
router.put('/:id', authController.protect, async (req, res) => {
    try {
        const task = await taskService.updateTask(
            req.user.organizationId,
            req.params.id,
            req.body,
            req.user._id
        );
        res.json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Complete task
router.put('/:id/complete', authController.protect, async (req, res) => {
    try {
        const task = await taskService.completeTask(
            req.user.organizationId,
            req.params.id,
            req.user._id
        );
        res.json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete task
router.delete('/:id', authController.protect, async (req, res) => {
    try {
        const result = await taskService.deleteTask(
            req.user.organizationId,
            req.params.id,
            req.user._id
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get stats
router.get('/stats/all', authController.protect, async (req, res) => {
    try {
        const stats = await taskService.getTaskStats(
            req.user.organizationId,
            req.query.userId // Optional: filter by user
        );
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
