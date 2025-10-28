import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import salesRoutes from './modules/sales/sales.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import clientsRoutes from './modules/clients/clients.routes';

dotenv.config();

const app = express();

// Middlewares - CORS atualizado
app.use(cors({
  origin: function(origin, callback) {
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:4000',
      'https://sales-gamification-indol.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean); // Remove undefined se FRONTEND_URL não existir
    
    // Aceita qualquer subdomínio da Vercel ou origens na lista
    if (!origin || allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', clientsRoutes);

// Rota 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
