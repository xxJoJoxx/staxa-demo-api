const request = require('supertest');
const { mockPrisma } = require('./setup');
const { createApp } = require('../src/app');

let app;

beforeAll(() => {
  app = createApp();
});

beforeEach(() => {
  jest.clearAllMocks();
});

const sampleTask = {
  id: 1,
  title: 'Test task',
  description: 'A test task',
  status: 'todo',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('GET /api/tasks', () => {
  it('returns a list of tasks', async () => {
    mockPrisma.task.findMany.mockResolvedValue([sampleTask]);
    mockPrisma.task.count.mockResolvedValue(1);

    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBe(1);
  });

  it('filters by status', async () => {
    mockPrisma.task.findMany.mockResolvedValue([sampleTask]);
    mockPrisma.task.count.mockResolvedValue(1);

    const res = await request(app).get('/api/tasks?status=todo');
    expect(res.status).toBe(200);
    expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'todo' },
      })
    );
  });

  it('respects limit and offset', async () => {
    mockPrisma.task.findMany.mockResolvedValue([]);
    mockPrisma.task.count.mockResolvedValue(0);

    const res = await request(app).get('/api/tasks?limit=10&offset=5');
    expect(res.status).toBe(200);
    expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 5,
      })
    );
  });

  it('caps limit at 100', async () => {
    mockPrisma.task.findMany.mockResolvedValue([]);
    mockPrisma.task.count.mockResolvedValue(0);

    await request(app).get('/api/tasks?limit=200');
    expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    );
  });

  it('returns 500 on database error', async () => {
    mockPrisma.task.findMany.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to list tasks');
  });
});

describe('GET /api/tasks/:id', () => {
  it('returns a single task', async () => {
    mockPrisma.task.findUnique.mockResolvedValue(sampleTask);

    const res = await request(app).get('/api/tasks/1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  it('returns 404 for non-existent task', async () => {
    mockPrisma.task.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/tasks/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });

  it('returns 500 on database error', async () => {
    mockPrisma.task.findUnique.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/tasks/1');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to get task');
  });
});

describe('POST /api/tasks', () => {
  it('creates a task with title only', async () => {
    const created = { ...sampleTask, description: null };
    mockPrisma.task.create.mockResolvedValue(created);

    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test task');
  });

  it('creates a task with all fields', async () => {
    mockPrisma.task.create.mockResolvedValue(sampleTask);

    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task', description: 'A test task', status: 'in_progress' });

    expect(res.status).toBe(201);
    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: {
        title: 'Test task',
        description: 'A test task',
        status: 'in_progress',
      },
    });
  });

  it('defaults status to todo for invalid status', async () => {
    mockPrisma.task.create.mockResolvedValue(sampleTask);

    await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task', status: 'invalid' });

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'todo' }),
    });
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Title is required');
  });

  it('returns 400 when title is empty', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Title is required');
  });

  it('trims title and description', async () => {
    mockPrisma.task.create.mockResolvedValue(sampleTask);

    await request(app)
      .post('/api/tasks')
      .send({ title: '  Test task  ', description: '  desc  ' });

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Test task',
        description: 'desc',
      }),
    });
  });

  it('returns 500 on database error', async () => {
    mockPrisma.task.create.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to create task');
  });
});

describe('PATCH /api/tasks/:id', () => {
  it('updates a task', async () => {
    const updated = { ...sampleTask, title: 'Updated' };
    mockPrisma.task.findUnique.mockResolvedValue(sampleTask);
    mockPrisma.task.update.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/api/tasks/1')
      .send({ title: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated');
  });

  it('updates status', async () => {
    const updated = { ...sampleTask, status: 'done' };
    mockPrisma.task.findUnique.mockResolvedValue(sampleTask);
    mockPrisma.task.update.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/api/tasks/1')
      .send({ status: 'done' });

    expect(res.status).toBe(200);
    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'done' },
    });
  });

  it('returns 404 for non-existent task', async () => {
    mockPrisma.task.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/tasks/999')
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid status', async () => {
    mockPrisma.task.findUnique.mockResolvedValue(sampleTask);

    const res = await request(app)
      .patch('/api/tasks/1')
      .send({ status: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid status');
  });

  it('returns 500 on database error', async () => {
    mockPrisma.task.findUnique.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .patch('/api/tasks/1')
      .send({ title: 'Updated' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to update task');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task', async () => {
    mockPrisma.task.findUnique.mockResolvedValue(sampleTask);
    mockPrisma.task.delete.mockResolvedValue(sampleTask);

    const res = await request(app).delete('/api/tasks/1');
    expect(res.status).toBe(204);
  });

  it('returns 404 for non-existent task', async () => {
    mockPrisma.task.findUnique.mockResolvedValue(null);

    const res = await request(app).delete('/api/tasks/999');
    expect(res.status).toBe(404);
  });

  it('returns 500 on database error', async () => {
    mockPrisma.task.findUnique.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/api/tasks/1');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to delete task');
  });
});

describe('PATCH /api/tasks/bulk/status', () => {
  it('updates multiple tasks status', async () => {
    const tasks = [
      { ...sampleTask, status: 'done' },
      { ...sampleTask, id: 2, status: 'done' },
    ];
    mockPrisma.task.updateMany.mockResolvedValue({ count: 2 });
    mockPrisma.task.findMany.mockResolvedValue(tasks);

    const res = await request(app)
      .patch('/api/tasks/bulk/status')
      .send({ ids: [1, 2], status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 400 when ids is missing', async () => {
    const res = await request(app)
      .patch('/api/tasks/bulk/status')
      .send({ status: 'done' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ids array is required');
  });

  it('returns 400 when ids is empty', async () => {
    const res = await request(app)
      .patch('/api/tasks/bulk/status')
      .send({ ids: [], status: 'done' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when ids is not an array', async () => {
    const res = await request(app)
      .patch('/api/tasks/bulk/status')
      .send({ ids: 'not-array', status: 'done' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(app)
      .patch('/api/tasks/bulk/status')
      .send({ ids: [1], status: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid status');
  });

  it('returns 400 when status is missing', async () => {
    const res = await request(app)
      .patch('/api/tasks/bulk/status')
      .send({ ids: [1] });

    expect(res.status).toBe(400);
  });

  it('returns 500 on database error', async () => {
    mockPrisma.task.updateMany.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .patch('/api/tasks/bulk/status')
      .send({ ids: [1], status: 'done' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to update tasks');
  });
});
