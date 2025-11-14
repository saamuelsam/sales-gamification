import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 4000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // SMTP Hostinger
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.hostinger.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'noreply@example.com',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'Fortal Sales Gamification',
};
