import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeSchema } from './database/connection.js';
import apiRoutes from './routes/api.js';
dotenv.config();
const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
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
    // Global error handler
    app.use((err, req, res, next) => {
        console.error('❌ Unhandled error:', err);
        res.status(500).json({ error: 'Internal server error' });
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
//# sourceMappingURL=server.js.map