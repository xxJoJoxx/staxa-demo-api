const { prisma } = require('./db');
const { migrate } = require('./migrate');

const SAMPLE_TASKS = [
  { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated deploys', status: 'done' },
  { title: 'Design landing page', description: 'Create wireframes and mockups for the marketing site', status: 'done' },
  { title: 'Implement user authentication', description: 'Add Clerk-based auth flow with JWT tokens', status: 'in_progress' },
  { title: 'Build API rate limiting', description: 'Add per-key rate limits using Redis sliding window', status: 'in_progress' },
  { title: 'Write API documentation', description: 'Document all endpoints with request/response examples', status: 'todo' },
  { title: 'Add monitoring and alerts', description: 'Set up health check monitoring and Slack alerts', status: 'todo' },
  { title: 'Performance testing', description: 'Load test the API with k6 to find bottlenecks', status: 'todo' },
  { title: 'Security audit', description: 'Review auth, input validation, and SQL injection prevention', status: 'todo' },
];

async function seed() {
  await migrate();

  // Clear existing tasks
  await prisma.task.deleteMany();

  // Insert sample tasks
  await prisma.task.createMany({
    data: SAMPLE_TASKS,
  });

  console.log(`Seeded ${SAMPLE_TASKS.length} tasks`);
  await prisma.$disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
