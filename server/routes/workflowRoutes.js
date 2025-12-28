const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/authController');
const workflowController = require('../controllers/workflowController');

// All routes protected
router.use(protect);

router.get('/', workflowController.getWorkflows);
router.post('/', workflowController.createWorkflow);
router.get('/:id', workflowController.getWorkflowById);
router.put('/:id/draft', workflowController.saveDraft);
router.post('/:id/publish', workflowController.publishWorkflow);
router.post('/:id/rollback', workflowController.rollbackWorkflow);
router.delete('/:id', workflowController.deleteWorkflow);

module.exports = router;
