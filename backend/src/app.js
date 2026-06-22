import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import candidateRoutes from './routes/candidate.routes.js';
import clientRoutes from './routes/client.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import noticeRoutes from './routes/notice.routes.js';
import activityRoutes from './routes/activity.routes.js';
import reportRoutes from './routes/report.routes.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: false, // Allows images/uploads to be loaded cross-origin during dev
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login requests per `window`
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

app.use('/api', limiter);
app.use('/api/auth', authLimiter);

app.use(express.json());
app.use(cookieParser());



// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reports', reportRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Catch-all route for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack || err.message || err);
  res.status(500).json({ 
    message: err.message || 'An unexpected error occurred on the server' 
  });
});

export default app;
