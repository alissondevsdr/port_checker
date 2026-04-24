import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeSchema } from './database/connection.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const downloadsDir = path.resolve(serverDir, '../../downloads');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://192.168.1.188:5173',  // seu IP
    /^http:\/\/192\.168\.1\.\d+:5173$/,  // qualquer IP da rede
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));



// Aumentar limites de JSON para suportar uploads de arquivos Excel em base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize DB then start server
initializeSchema()
  .then(() => {
    console.log('✅ Database schema initialized');
    app.use('/api', apiRoutes);
    app.use('/downloads', express.static(downloadsDir));

    // Global error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('❌ Unhandled error at', req.method, req.path, ':', err);
      res.status(500).json({ 
        error: 'Internal server error', 
        message: err.message,
        path: req.path
      });
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🌐 Accessible at http://<your-ip>:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });
