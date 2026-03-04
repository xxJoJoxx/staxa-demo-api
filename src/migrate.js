const { execSync } = require('child_process');

async function migrate() {
  console.log('Running migrations...');

  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env },
    });
    console.log('Migrations complete');
  } catch (err) {
    console.error('Migration failed:', err.message);
    throw err;
  }
}

module.exports = { migrate };
