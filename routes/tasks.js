import express from 'express';
import Task from '../models/Task.js';
import { authenticate } from '../middleware/auth.js';
import { taskValidation, validate } from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks for current user with search and filters
// @access  Private
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { search, status, priority, sort = '-createdAt' } = req.query;

        // Build query
        const query = { user: req.userId };

        // Search by title or description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by priority
        if (priority) {
            query.priority = priority;
        }

        // Execute query with sorting
        const tasks = await Task.find(query).sort(sort);

        res.json({
            success: true,
            data: {
                tasks,
                count: tasks.length,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Check if task belongs to user
        if (task.user.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this task',
            });
        }

        res.json({
            success: true,
            data: { task },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', authenticate, taskValidation, validate, async (req, res, next) => {
    try {
        const { title, description, status, priority } = req.body;

        const task = new Task({
            title,
            description,
            status: status || 'todo',
            priority: priority || 'medium',
            user: req.userId,
        });

        await task.save();

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: { task },
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', authenticate, taskValidation, validate, async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Check if task belongs to user
        if (task.user.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this task',
            });
        }

        // Update fields
        const { title, description, status, priority } = req.body;

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (status !== undefined) task.status = status;
        if (priority !== undefined) task.priority = priority;

        await task.save();

        res.json({
            success: true,
            message: 'Task updated successfully',
            data: { task },
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Check if task belongs to user
        if (task.user.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this task',
            });
        }

        await Task.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: 'Task deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
