import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import salesRoutes from './modules/sales/sales.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import clientsRoutes from './modules/clients/clients.routes';

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
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
