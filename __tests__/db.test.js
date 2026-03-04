const { mockPrisma } = require('./setup');

describe('db module', () => {
  it('exports a prisma client instance', () => {
    const { prisma } = require('../src/db');
    expect(prisma).toBeDefined();
    expect(prisma.task).toBeDefined();
  });
});
