// backend/src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { globalLimiter, timeoutMiddleware, sanitizeLogsMiddleware } from './middleware/security.middleware';
import { sanitizeStrings } from './middleware/validation.middleware';
import authRoutes from './modules/auth/auth.routes';
import salesRoutes from './modules/sales/sales.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import clientsRoutes from './modules/clients/clients.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import levelRoutes from './modules/levels/level.routes';
import userRoutes from './modules/users/user.routes';
import teamRoutes from './modules/team/team.routes';
import commissionRoutes from './modules/commissions/commission.routes';
import adminRoutes from './modules/admin/admin.routes';
import benefitRoutes from './modules/benefits/benefit.routes';
import appointmentRoutes from './modules/appointments/appointment.routes';
import ceoRoutes from './modules/ceo/ceo.routes';
import financialRoutes from './modules/financial/financial.routes';


dotenv.config();

const app = express();

// ✅ SEGURANÇA: Helmet (headers HTTP seguros)
app.use(helmet({
  contentSecurityPolicy: false, // Desabilita CSP para não quebrar o frontend
  crossOriginEmbedderPolicy: false,
}));

// ✅ PERFORMANCE: Compressão Gzip/Brotli
app.use(compression());

// ✅ SEGURANÇA: Rate Limiting Global
app.use(globalLimiter);

// ✅ SEGURANÇA: Timeout de 30 segundos
app.use(timeoutMiddleware(30));

// ✅ CORS COMPLETO - Permitir headers customizados
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost',        // Nginx servindo na porta 80
  'http://127.0.0.1',        // Nginx IP local
  'http://127.0.0.1:5173',
  'https://sales-gamification-indol.vercel.app',
  'https://sales.sesfortal.com.br', // 👈 adiciona o domínio de produção
  process.env.FRONTEND_URL
].filter(Boolean);

    
    // Se não tiver origin (requests diretas, mobile, etc), liberar
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.includes('.vercel.app'))) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS bloqueado: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With',
    'X-Custom-Header'
  ],
  maxAge: 86400, // 24 horas cache do preflight
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ SEGURANÇA: Sanitização de inputs (previne XSS)
app.use(sanitizeStrings);

// ✅ SEGURANÇA: Sanitização de logs (remove dados sensíveis)
app.use(sanitizeLogsMiddleware);

// ✅ Servir arquivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// ✅ Middleware de Cache Control (aplicado em todas as respostas)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Para requisições GET, permitir cache apenas no navegador, não em proxies
  if (req.method === 'GET' && !req.path.includes('/api/')) {
    res.set('Cache-Control', 'private, max-age=3600'); // 1 hora
  } else {
    // Para API, nunca cachear
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  
  // Headers de segurança
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Rotas da API
app.use('/api/team', teamRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/users', userRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/benefits', benefitRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ceo', ceoRoutes);
app.use('/api/financial', financialRoutes);

// ✅ Middleware de erro global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Erro não tratado:', {
    message: err.message,
    status: err.status || 500,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error'
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// ✅ Rota 404
app.use((req: Request, res: Response) => {
  console.warn(`⚠️ Rota não encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

export default app;
