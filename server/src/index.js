import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authenticate } from './middleware/auth.js';
import { errorMiddleware, HttpError } from './lib/errors.js';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import studentRoutes from './routes/student.js';
import advisorRoutes from './routes/advisor.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
  })
);
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// Everything under /api requires a signed-in Google account.
app.use('/api', authenticate);
app.use('/api/auth', authRoutes);
app.use('/api', companyRoutes);
app.use('/api/me', studentRoutes);
app.use('/api/advisor', advisorRoutes);

app.use((_req, _res, next) => next(new HttpError(404, 'NOT_FOUND', 'Route not found')));
app.use(errorMiddleware);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
