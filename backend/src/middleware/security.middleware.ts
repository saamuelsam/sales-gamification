// backend/src/middleware/security.middleware.ts
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// ✅ Rate Limiter para Login/Registro (previne força bruta)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Ignorar requisições autenticadas com sucesso
  skipSuccessfulRequests: true,
});

// ✅ Rate Limiter Global (previne DDoS)
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto por IP
  message: {
    success: false,
    message: 'Muitas requisições. Aguarde um momento.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Rate Limiter para APIs sensíveis (admin, financeiro)
export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // 20 requisições por minuto
  message: {
    success: false,
    message: 'Limite de requisições excedido. Aguarde um momento.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Sanitização de logs (remove dados sensíveis)
export const sanitizeLogsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Remove campos sensíveis antes de logar
  const sanitizedBody = { ...req.body };
  const sensitiveFields = ['password', 'token', 'jwt', 'secret', 'authorization'];
  
  sensitiveFields.forEach(field => {
    if (sanitizedBody[field]) {
      sanitizedBody[field] = '***REDACTED***';
    }
  });

  // Sobrescreve o body para logs
  req.body = sanitizedBody;
  next();
};

// ✅ Timeout de requisições (previne travamento)
export const timeoutMiddleware = (seconds: number = 30) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout',
        });
      }
    }, seconds * 1000);

    // Limpa o timeout quando a resposta for enviada
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

// ✅ Validação de Content-Type (previne ataques)
export const validateContentTypeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Content-Type deve ser application/json',
      });
    }
  }
  next();
};
