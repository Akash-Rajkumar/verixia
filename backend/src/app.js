import express from 'express';
import cors from 'cors';
import { sendError } from './utils/response.js';

import healthRouter from './routes/health.js';
import agentsRouter from './routes/agents.js';
import charterRouter from './routes/charter.js';
import conversationsRouter from './routes/conversations.js';
import interactionsRouter from './routes/interactions.js';
import badAgentRouter from './routes/badAgent.js';
import transactionsRouter from './routes/transactions.js';
import receiptsRouter from './routes/receipts.js';
import reputationRouter from './routes/reputation.js';
import eventsRouter from './routes/events.js';
import adminRouter from './routes/admin.js';

const app = express();

const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like server-to-server, curl, tests)
    if (!origin || origin === frontendOrigin) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Mount API routes under /api/v1
app.use('/api/v1', healthRouter);
app.use('/api/v1', agentsRouter);
app.use('/api/v1', charterRouter);
app.use('/api/v1', conversationsRouter);
app.use('/api/v1', interactionsRouter);
app.use('/api/v1', badAgentRouter);
app.use('/api/v1', transactionsRouter);
app.use('/api/v1', receiptsRouter);
app.use('/api/v1', reputationRouter);
app.use('/api/v1', eventsRouter);
app.use('/api/v1', adminRouter);

// 404 Handler for unknown routes
app.use((req, res) => {
  return sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`);
});

// Final Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return sendError(res, 403, 'CORS_ERROR', 'CORS request origin not allowed');
  }
  const status = err.status || 500;
  const code = err.code || 'INTERNAL';
  return sendError(res, status, code, err.message || 'Internal server error', err.details || {});
});

export default app;
