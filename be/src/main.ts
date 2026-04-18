import { createApp } from './app/create-app.js';
import { registerRoutes } from './app/register-routes.js';
import { registerEventHandlers, startOutboxProcessor } from './app/bootstrap-events.js';

const PORT = process.env.PORT || 3000;

async function main() {
  // Create Express app
  const app = createApp();

  // Register all routes
  registerRoutes(app);

  // Error handling middleware (must be after routes)
  app.use((err: Error, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  // Bootstrap event system
  registerEventHandlers();
  startOutboxProcessor();

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 SPX Express Backend running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/health`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
