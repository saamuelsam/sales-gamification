// backend/src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * 🛡️ Middleware de validação de inputs com Zod
 * Protege contra dados malformados, XSS e injeções
 */

// ========== SCHEMAS DE VALIDAÇÃO ==========

export const createSaleSchema = z.object({
  client_id: z.string().uuid().optional(),
  client_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo').trim(),
  value: z.number().positive('Valor deve ser positivo').max(999999999, 'Valor muito alto'),
  kilowatts: z.number().positive('Kilowatts deve ser positivo').max(999999, 'Kilowatts muito alto'),
  insurance_value: z.number().positive().max(999999999).optional(),
  sale_type: z.enum(['direct', 'consortium', 'cash', 'card']).optional(),
  consortium_value: z.number().positive().max(999999999).optional(),
  consortium_term: z.number().int().min(1).max(120, 'Prazo máximo: 120 meses').optional(),
  consortium_monthly_payment: z.number().positive().max(999999999).optional(),
  consortium_admin_fee: z.number().positive().max(100).optional(),
  template_type: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateSaleSchema = z.object({
  client_name: z.string().min(3).max(100).trim().optional(),
  value: z.number().positive().max(999999999).optional(),
  kilowatts: z.number().positive().max(999999).optional(),
  insurance_value: z.number().positive().max(999999999).optional().nullable(),
  sale_type: z.enum(['direct', 'consortium', 'cash', 'card']).optional(),
  consortium_value: z.number().positive().max(999999999).optional().nullable(),
  consortium_term: z.number().int().min(1).max(120).optional().nullable(),
  consortium_monthly_payment: z.number().positive().max(999999999).optional().nullable(),
  consortium_admin_fee: z.number().positive().max(100).optional().nullable(),
  status: z.enum(['pending', 'approved', 'delivered', 'rejected', 'cancelled']).optional(),
  notes: z.string().max(1000).optional().nullable(),
  product_delivered: z.boolean().optional(),
  delivery_date: z.string().datetime().optional().nullable(),
  installation_proof_url: z.string().url().max(500).optional().nullable(),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100).trim().optional(),
  email: z.string().email('Email inválido').max(100).optional(),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido').optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido').optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  email: z.string().email().max(100),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido').optional(),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido').optional(),
  role: z.enum(['consultant', 'master_consultant', 'senior_consultant', 'prime_consultant', 'executive', 'admin', 'financeiro', 'ceo', 'diretor_comercial']).optional(),
  parent_id: z.string().uuid().optional(),
});

export const addTeamMemberSchema = z.object({
  user_id: z.string().uuid('ID de usuário inválido'),
  parent_id: z.string().uuid('ID de líder inválido').optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum(['consultant', 'master_consultant', 'senior_consultant', 'prime_consultant', 'executive', 'admin', 'financeiro', 'ceo', 'diretor_comercial']),
});

export const adjustPointsSchema = z.object({
  points: z.number().int().min(-999999, 'Ajuste muito negativo').max(999999, 'Ajuste muito alto'),
  reason: z.string().min(10, 'Motivo deve ter no mínimo 10 caracteres').max(500, 'Motivo muito longo'),
});

export const createClientSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido').optional(),
  email: z.string().email().max(100).optional(),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido').optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
});

export const updateSaleStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'delivered', 'rejected', 'cancelled']),
});

export const createNotificationSchema = z.object({
  user_id: z.string().uuid().optional(),
  type: z.string().max(50),
  title: z.string().min(3).max(200).trim(),
  message: z.string().min(10).max(1000).trim(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const registerSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  email: z.string().email().max(100),
  password: z.string().min(6).max(100),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido').optional(),
  parent_id: z.string().uuid().optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100),
});

export const createAppointmentSchema = z.object({
  client_name: z.string().min(3).max(100).trim(),
  client_phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido'),
  client_email: z.string().email().optional(),
  appointment_date: z.string().datetime('Data inválida'),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
  notes: z.string().max(1000).optional(),
});

// ========== MIDDLEWARE FACTORY ==========

/**
 * Factory para criar middleware de validação
 * @param schema - Schema Zod para validação
 * @param source - Fonte dos dados ('body', 'query', 'params')
 */
export const validate = (schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      
      // Validar e transformar dados
      const validated = schema.parse(data);
      
      // Substituir dados originais pelos validados
      req[source] = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors,
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erro na validação de dados',
      });
    }
  };
};

/**
 * Middleware para sanitizar strings (prevenir XSS)
 */
export const sanitizeStrings = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove tags HTML e scripts
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
};

/**
 * Middleware para validar UUIDs em params
 */
export const validateUUID = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uuid = req.params[paramName];
    
    if (!uuid) {
      return res.status(400).json({
        success: false,
        message: `Parâmetro ${paramName} obrigatório`,
      });
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(uuid)) {
      return res.status(400).json({
        success: false,
        message: `${paramName} inválido`,
      });
    }
    
    next();
  };
};

/**
 * Middleware para validar paginação
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Página deve ser maior que 0',
    });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limite deve estar entre 1 e 100',
    });
  }
  
  req.query.page = String(page);
  req.query.limit = String(limit);
  
  next();
};
