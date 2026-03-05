#!/bin/sh
set -e

# Run Prisma migrations
echo "Running database migrations..."
npx prisma db push --skip-generate --accept-data-loss
echo "Migrations complete"

# Forward SIGTERM to the Node.js process
trap 'kill -TERM $NODE_PID' TERM INT

# Start the Node.js application
echo "Starting application..."
exec "$@" &
NODE_PID=$!

# Wait for the Node.js process to terminate
wait $NODE_PID
EXIT_STATUS=$?

# Exit with the same status as the Node.js process
exit $EXIT_STATUS
