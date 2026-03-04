const { prisma } = require('../db');

function healthRoutes(app) {
  // Basic health — just confirms the process is running
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Deep health — checks database connectivity
  app.get('/health/ready', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1 as check`;
      res.json({
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        error: err.message,
      });
    }
  });
}

module.exports = { healthRoutes };
