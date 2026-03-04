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

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('GET /health/ready', () => {
  it('returns ok when database is connected', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ check: 1 }]);

    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  it('returns 503 when database is disconnected', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.database).toBe('disconnected');
    expect(res.body.error).toBe('Connection refused');
  });
});

describe('GET /', () => {
  it('returns API info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Staxa Demo API');
    expect(res.body.endpoints).toBeDefined();
  });
});
