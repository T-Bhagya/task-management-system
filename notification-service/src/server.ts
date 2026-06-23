import express from 'express';
import cors from 'cors';
import * as http from 'http';
import * as path from 'path';
import dotenv from 'dotenv';
import router from './routes';
import { initSocketServer } from './socket';

// Load configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Serve testing dashboard statically
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', router);

// Error Handling Middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocketServer(server);

// Start listening
server.listen(PORT, () => {
  console.log(`🚀 Notification Service is running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server initialized. Test dashboard served at http://localhost:${PORT}`);
});
