// backend/src/middleware/checkFinancialPermission.ts
import { Request, Response, NextFunction } from 'express';

/**
 * 🔐 Middleware de Segurança: Apenas CEO e Financeiro podem aprovar/rejeitar vendas
 * Protege contra fraudes e manipulação de vendas por consultores
 */
export const checkFinancialPermission = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado',
    });
  }

  // Verificar se está tentando aprovar
  const { status } = req.body;
  
  console.log('🔍 [checkFinancialPermission] Status recebido:', status);
  console.log('🔍 [checkFinancialPermission] User role:', user.role);
  
  const isApprovingStatus = status === 'approved';

  // Se está tentando aprovar, apenas CEO, Financeiro e Admin podem
  if (isApprovingStatus) {
    const allowedRoles = ['ceo', 'financeiro', 'admin'];
    
    if (!allowedRoles.includes(user.role)) {
      console.log('❌ [checkFinancialPermission] Bloqueando aprovação para role:', user.role);
      return res.status(403).json({
        success: false,
        message: '❌ Acesso negado. Apenas o departamento financeiro, CEO e Admin podem aprovar vendas.',
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          userRole: user.role,
          requiredRoles: allowedRoles,
          attemptedAction: 'approve_sale'
        }
      });
    }
  }

  console.log('✅ [checkFinancialPermission] Permitindo alteração de status');
  // Para outros status, qualquer usuário autenticado pode alterar
  next();
};

/**
 * 🔐 Middleware: Bloqueia edição de vendas após criação (exceto status pelo financeiro)
 * Consultores não podem editar valor, kW ou dados da venda após criar
 */
export const preventSaleEdit = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado',
    });
  }

  // CEO e Admin podem editar tudo
  if (['ceo', 'admin'].includes(user.role)) {
    return next();
  }

  // Financeiro pode mudar apenas o status
  if (user.role === 'financeiro') {
    const allowedFields = ['status', 'financial_notes'];
    const requestedFields = Object.keys(req.body);
    
    const hasUnauthorizedFields = requestedFields.some(
      field => !allowedFields.includes(field)
    );

    if (hasUnauthorizedFields) {
      return res.status(403).json({
        success: false,
        message: 'Financeiro pode apenas alterar o status e adicionar observações',
        error: {
          code: 'FIELD_EDIT_RESTRICTED',
          allowedFields,
          requestedFields,
        }
      });
    }
  }

  // Consultores não podem editar vendas após criação
  if (['consultor', 'gerente', 'diretor_comercial'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Vendas não podem ser editadas após criação. Entre em contato com o financeiro.',
      error: {
        code: 'SALE_EDIT_FORBIDDEN',
      }
    });
  }

  next();
};
