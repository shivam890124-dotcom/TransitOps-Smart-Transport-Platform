import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initDb } from './server/config/db.js';

// Import our API routes
import authRoutes from './server/routes/authRoutes.js';
import vehicleRoutes from './server/routes/vehicleRoutes.js';
import driverRoutes from './server/routes/driverRoutes.js';
import tripRoutes from './server/routes/tripRoutes.js';
import maintenanceRoutes from './server/routes/maintenanceRoutes.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize and seed database
  await initDb();

  // Basic middleware
  app.use(cors());
  app.use(express.json());

  // Mount API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/drivers', driverRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/maintenance', maintenanceRoutes);

  // Diagnostic health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Handle Static Asset Serving and Client-Side Routing
  if (process.env.NODE_ENV !== 'production') {
    // Development mode: Integrate Vite dev server middleware
    console.log('Starting Express in DEVELOPMENT mode with Vite integration...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve static output from /dist
    console.log('Starting Express in PRODUCTION mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TransitOps server successfully running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
});
