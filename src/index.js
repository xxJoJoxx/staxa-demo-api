const { createApp } = require('./app');
const { migrate } = require('./migrate');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await migrate();
    const app = createApp();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Staxa Demo API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
