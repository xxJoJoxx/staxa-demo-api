const { prisma } = require('../db');

const VALID_STATUSES = ['todo', 'in_progress', 'done'];

function taskRoutes(app) {
  // List tasks
  // GET /api/tasks?status=todo&limit=50&offset=0
  app.get('/api/tasks', async (req, res) => {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      const where = {};
      if (status) {
        where.status = status;
      }

      const take = Math.min(parseInt(limit), 100);
      const skip = parseInt(offset);

      const [data, total] = await Promise.all([
        prisma.task.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
        }),
        prisma.task.count({ where }),
      ]);

      res.json({
        data,
        meta: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (err) {
      console.error('List tasks error:', err);
      res.status(500).json({ error: 'Failed to list tasks' });
    }
  });

  // Get single task
  // GET /api/tasks/:id
  app.get('/api/tasks/:id', async (req, res) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: parseInt(req.params.id) },
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ data: task });
    } catch (err) {
      console.error('Get task error:', err);
      res.status(500).json({ error: 'Failed to get task' });
    }
  });

  // Create task
  // POST /api/tasks { title, description?, status? }
  app.post('/api/tasks', async (req, res) => {
    try {
      const { title, description, status } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const taskStatus = status && VALID_STATUSES.includes(status) ? status : 'todo';

      const task = await prisma.task.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          status: taskStatus,
        },
      });

      res.status(201).json({ data: task });
    } catch (err) {
      console.error('Create task error:', err);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Update task
  // PATCH /api/tasks/:id { title?, description?, status? }
  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      const { title, description, status } = req.body;

      const existing = await prisma.task.findUnique({
        where: { id: parseInt(req.params.id) },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (status && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (status !== undefined) updateData.status = status;

      const task = await prisma.task.update({
        where: { id: parseInt(req.params.id) },
        data: updateData,
      });

      res.json({ data: task });
    } catch (err) {
      console.error('Update task error:', err);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Delete task
  // DELETE /api/tasks/:id
  app.delete('/api/tasks/:id', async (req, res) => {
    try {
      const existing = await prisma.task.findUnique({
        where: { id: parseInt(req.params.id) },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Task not found' });
      }

      await prisma.task.delete({
        where: { id: parseInt(req.params.id) },
      });

      res.status(204).send();
    } catch (err) {
      console.error('Delete task error:', err);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // Bulk status update
  // PATCH /api/tasks/bulk/status { ids: [1,2,3], status: "done" }
  app.patch('/api/tasks/bulk/status', async (req, res) => {
    try {
      const { ids, status } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'ids array is required' });
      }

      if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
      }

      await prisma.task.updateMany({
        where: { id: { in: ids.map(Number) } },
        data: { status },
      });

      const updated = await prisma.task.findMany({
        where: { id: { in: ids.map(Number) } },
      });

      res.json({ data: updated });
    } catch (err) {
      console.error('Bulk update error:', err);
      res.status(500).json({ error: 'Failed to update tasks' });
    }
  });
}

module.exports = { taskRoutes };
