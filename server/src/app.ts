import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes/index.js';

export const createApp = () => {
  const app = express();

  // Security Middleware
  app.use(helmet({
    crossOriginResourcePolicy: false, // allow loading uploaded files from frontend
  }));

  // CORS Configuration
  app.use(cors({
    origin: '*',
    credentials: true,
  }));

  // Logging
  app.use(morgan('dev'));

  // Body Parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static uploads directory
  const uploadsPath = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'E-Document Management API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routes
  app.use('/api', apiRoutes);

  // Serve Frontend Production Assets (Single-Port Fullstack for Cloudflare Tunnel & Production)
  const clientDistPaths = [
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), './dist/client'),
  ];
  const foundDistPath = clientDistPaths.find((p) => fs.existsSync(p));

  if (foundDistPath) {
    app.use(express.static(foundDistPath));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(foundDistPath, 'index.html'));
    });
  }


  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'ເກີດຂໍ້ຜິດພາດໃນລະບົບ (Internal Server Error)',
    });
  });

  return app;
};
