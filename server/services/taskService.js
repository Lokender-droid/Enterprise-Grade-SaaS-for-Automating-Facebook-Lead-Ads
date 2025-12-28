const Task = require('../models/Task');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');

<<<<<<< HEAD
const notificationService = require('./notificationService');

=======
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
class TaskService {
    /**
     * Create a new task
     */
<<<<<<< HEAD
    async createTask(taskData, createdBy, io = null) {
=======
    async createTask(taskData, createdBy) {
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
        try {
            const task = await Task.create({
                organizationId: taskData.organizationId,
                leadId: taskData.leadId,
                title: taskData.title,
                description: taskData.description,
                type: taskData.type || 'other',
                status: 'pending',
                priority: taskData.priority || 'medium',
                assignedTo: taskData.assignedTo || createdBy,
                createdBy,
                dueDate: taskData.dueDate,
                reminder: taskData.reminder || { enabled: false },
                notes: taskData.notes
            });

            // Log activity
<<<<<<< HEAD
            // Log activity (Only if leadId exists, otherwise it's a general task)
            if (taskData.leadId) {
                await Activity.create({
                    organizationId: taskData.organizationId,
                    leadId: taskData.leadId,
                    type: 'task_created',
                    title: 'Task created',
                    description: `Created task: ${taskData.title}`,
                    performedBy: createdBy,
                    performedByType: 'user',
                    relatedTaskId: task._id,
                    metadata: {
                        taskType: task.type,
                        priority: task.priority,
                        dueDate: task.dueDate
                    }
                });
            }

            // Send Notification if assigned to someone else
            if (task.assignedTo.toString() !== createdBy.toString()) {
                await notificationService.createNotification({
                    organizationId: taskData.organizationId,
                    recipient: task.assignedTo,
                    type: 'task_assigned',
                    title: 'New Task Assigned',
                    message: `You have been assigned a new task: ${task.title}`,
                    relatedId: task._id,
                    relatedModel: 'Task'
                }, io);
            }
=======
            await Activity.create({
                organizationId: taskData.organizationId,
                leadId: taskData.leadId,
                type: 'task_created',
                title: 'Task created',
                description: `Created task: ${taskData.title}`,
                performedBy: createdBy,
                performedByType: 'user',
                relatedTaskId: task._id,
                metadata: {
                    taskType: task.type,
                    priority: task.priority,
                    dueDate: task.dueDate
                }
            });
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19

            return await task.populate('assignedTo createdBy', 'name email');
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    /**
     * Get tasks with filters
     */
    async getTasks(organizationId, filters = {}) {
        try {
            const query = { organizationId };

            if (filters.leadId) query.leadId = filters.leadId;
            if (filters.assignedTo) query.assignedTo = filters.assignedTo;
            if (filters.status) query.status = filters.status;
            if (filters.priority) query.priority = filters.priority;
            if (filters.type) query.type = filters.type;

            // Date filters
            if (filters.dueBefore) {
                query.dueDate = { $lte: new Date(filters.dueBefore) };
            }
            if (filters.dueAfter) {
                query.dueDate = { ...query.dueDate, $gte: new Date(filters.dueAfter) };
            }

            const tasks = await Task.find(query)
                .populate('assignedTo createdBy leadId', 'name email')
                .sort({ dueDate: 1, priority: -1 })
                .lean();

            return tasks;
        } catch (error) {
            console.error('Error getting tasks:', error);
            throw error;
        }
    }

    /**
     * Get single task
     */
    async getTask(organizationId, taskId) {
        try {
            const task = await Task.findOne({ _id: taskId, organizationId })
                .populate('assignedTo createdBy leadId');

            if (!task) {
                throw new Error('Task not found');
            }

            return task;
        } catch (error) {
            console.error('Error getting task:', error);
            throw error;
        }
    }

    /**
     * Update task
     */
    async updateTask(organizationId, taskId, updates, updatedBy) {
        try {
            const task = await Task.findOne({ _id: taskId, organizationId });

            if (!task) {
                throw new Error('Task not found');
            }

            const allowedUpdates = [
                'title', 'description', 'type', 'status', 'priority',
                'assignedTo', 'dueDate', 'reminder', 'notes'
            ];

            allowedUpdates.forEach(key => {
                if (updates[key] !== undefined) {
                    task[key] = updates[key];
                }
            });

            task.updatedAt = new Date();
            await task.save();

            // Log activity
            await Activity.create({
                organizationId,
                leadId: task.leadId,
                type: 'task_created',
                title: 'Task updated',
                description: `Updated task: ${task.title}`,
                performedBy: updatedBy,
                performedByType: 'user',
                relatedTaskId: task._id,
                metadata: { updates: Object.keys(updates) }
            });

            return await task.populate('assignedTo createdBy leadId');
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }

    /**
     * Complete task
     */
    async completeTask(organizationId, taskId, completedBy) {
        try {
            const task = await Task.findOne({ _id: taskId, organizationId });

            if (!task) {
                throw new Error('Task not found');
            }

            task.status = 'completed';
            task.completedAt = new Date();
            await task.save();

            // Log activity
            await Activity.create({
                organizationId,
                leadId: task.leadId,
                type: 'task_completed',
                title: 'Task completed',
                description: `Completed task: ${task.title}`,
                performedBy: completedBy,
                performedByType: 'user',
                relatedTaskId: task._id
            });

            return await task.populate('assignedTo createdBy leadId');
        } catch (error) {
            console.error('Error completing task:', error);
            throw error;
        }
    }

    /**
     * Delete task
     */
    async deleteTask(organizationId, taskId, deletedBy) {
        try {
            const task = await Task.findOne({ _id: taskId, organizationId });

            if (!task) {
                throw new Error('Task not found');
            }

            const taskTitle = task.title;
            const leadId = task.leadId;

            await Task.deleteOne({ _id: taskId });

            // Log activity
            await Activity.create({
                organizationId,
                leadId,
                type: 'task_created',
                title: 'Task deleted',
                description: `Deleted task: ${taskTitle}`,
                performedBy: deletedBy,
                performedByType: 'user',
                metadata: { taskTitle }
            });

            return { success: true, message: 'Task deleted successfully' };
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }

    /**
     * Get overdue tasks
     */
    async getOverdueTasks(organizationId, userId = null) {
        try {
            const query = {
                organizationId,
                status: { $in: ['pending', 'in-progress'] },
                dueDate: { $lt: new Date() }
            };

            if (userId) {
                query.assignedTo = userId;
            }

            const tasks = await Task.find(query)
                .populate('assignedTo leadId', 'name email')
                .sort({ dueDate: 1 })
                .lean();

            return tasks;
        } catch (error) {
            console.error('Error getting overdue tasks:', error);
            throw error;
        }
    }

    /**
     * Get task statistics
     */
    async getTaskStats(organizationId, userId = null) {
        try {
            const query = { organizationId };
            if (userId) query.assignedTo = userId;

            const [total, pending, inProgress, completed, overdue] = await Promise.all([
                Task.countDocuments(query),
                Task.countDocuments({ ...query, status: 'pending' }),
                Task.countDocuments({ ...query, status: 'in-progress' }),
                Task.countDocuments({ ...query, status: 'completed' }),
                Task.countDocuments({
                    ...query,
                    status: { $in: ['pending', 'in-progress'] },
                    dueDate: { $lt: new Date() }
                })
            ]);

            return {
                total,
                pending,
                inProgress,
                completed,
                overdue,
                completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
            };
        } catch (error) {
            console.error('Error getting task stats:', error);
            throw error;
        }
    }
}

module.exports = new TaskService();
