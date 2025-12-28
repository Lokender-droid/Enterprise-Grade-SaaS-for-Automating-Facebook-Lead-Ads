const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');

<<<<<<< HEAD
const authController = require('../controllers/authController');

// Create task
router.post('/', authController.protect, async (req, res) => {
=======
const ensureAuth = (req, res, next) => next(); // Placeholder

// Create task
router.post('/', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    try {
        const taskData = {
            ...req.body,
            organizationId: req.user.organizationId
        };
<<<<<<< HEAD
        const task = await taskService.createTask(taskData, req.user._id, req.io);
=======
        const task = await taskService.createTask(taskData, req.user._id);
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get tasks
<<<<<<< HEAD
router.get('/', authController.protect, async (req, res) => {
=======
router.get('/', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
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
<<<<<<< HEAD
router.get('/:id', authController.protect, async (req, res) => {
=======
router.get('/:id', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
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
<<<<<<< HEAD
router.put('/:id', authController.protect, async (req, res) => {
=======
router.put('/:id', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
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
<<<<<<< HEAD
router.put('/:id/complete', authController.protect, async (req, res) => {
=======
router.put('/:id/complete', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
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
<<<<<<< HEAD
router.delete('/:id', authController.protect, async (req, res) => {
=======
router.delete('/:id', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
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
<<<<<<< HEAD
router.get('/stats/all', authController.protect, async (req, res) => {
=======
router.get('/stats/all', ensureAuth, async (req, res) => {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
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
