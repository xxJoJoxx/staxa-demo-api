const { execSync } = require('child_process');

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

const { migrate } = require('../src/migrate');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('migrate', () => {
  it('runs prisma db push', async () => {
    execSync.mockReturnValue(undefined);

    await migrate();

    expect(execSync).toHaveBeenCalledWith(
      'npx prisma db push --skip-generate --accept-data-loss',
      expect.objectContaining({ stdio: 'inherit' })
    );
  });

  it('throws on migration failure', async () => {
    execSync.mockImplementation(() => {
      throw new Error('Migration failed');
    });

    await expect(migrate()).rejects.toThrow('Migration failed');
  });
});
