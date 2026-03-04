const express = require('express');
const cors = require('cors');
const { healthRoutes } = require('./routes/health');
const { taskRoutes } = require('./routes/tasks');

function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
  });

  // Routes
  healthRoutes(app);
  taskRoutes(app);

  // Root — useful info for anyone who hits the base URL
  app.get('/', (req, res) => {
    res.json({
      name: 'Staxa Demo API',
      version: '1.0.0',
      description: 'A task management API deployed on Staxa',
      endpoints: {
        health: '/health',
        health_ready: '/health/ready',
        tasks: '/api/tasks',
      },
    });
  });

  return app;
}

module.exports = { createApp };
