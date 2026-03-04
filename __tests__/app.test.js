require('./setup');
const { createApp } = require('../src/app');

describe('createApp', () => {
  it('returns an express app', () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });
});
