// backend/src/middleware/ownership.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { pool } from '@config/database';

/**
 * 🔒 Middleware para validar se o usuário tem permissão para acessar um recurso
 * Implementa proteção contra IDOR (Insecure Direct Object Reference)
 */

// Roles administrativos que têm acesso total
const ADMIN_ROLES = ['ceo', 'admin', 'diretor_comercial'];

/**
 * Verifica se o usuário é admin
 */
const isAdmin = (role: string | undefined): boolean => {
  return role ? ADMIN_ROLES.includes(role.toLowerCase()) : false;
};

/**
 * Middleware para verificar ownership de usuário
 * Garante que consultores só possam acessar/modificar seus próprios dados
 */
export const verifyUserOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;
    const targetUserId = req.params.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
    }

    // Admins têm acesso total
    if (isAdmin(currentUserRole)) {
      return next();
    }

    // Usuários só podem acessar seus próprios dados
    if (currentUserId !== targetUserId) {
      console.warn(
        `🚨 [SECURITY] Tentativa de acesso não autorizado: User ${currentUserId} tentou acessar User ${targetUserId}`
      );
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: você só pode acessar seus próprios dados',
      });
    }

    next();
  } catch (error) {
    console.error('❌ Erro no verifyUserOwnership:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar permissões',
    });
  }
};

/**
 * Middleware para verificar ownership de venda
 * Garante que consultores só possam modificar/deletar suas próprias vendas
 */
export const verifySaleOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;
    const saleId = req.params.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
    }

    // Financeiro, CEO e Admin têm acesso total às vendas
    if (isAdmin(currentUserRole) || currentUserRole === 'financeiro') {
      return next();
    }

    // Verificar se a venda pertence ao usuário
    const result = await pool.query(
      'SELECT user_id, status FROM sales WHERE id = $1',
      [saleId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Venda não encontrada',
      });
    }

    const sale = result.rows[0];

    // Usuário só pode acessar suas próprias vendas
    if (sale.user_id !== currentUserId) {
      console.warn(
        `🚨 [SECURITY] Tentativa de acesso não autorizado: User ${currentUserId} tentou acessar Sale ${saleId} (owner: ${sale.user_id})`
      );
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: você só pode acessar suas próprias vendas',
      });
    }

    // ⚠️ Vendas aprovadas só podem ser modificadas pelo Financeiro
    if (sale.status === 'approved' && req.method !== 'GET') {
      return res.status(403).json({
        success: false,
        message: 'Vendas aprovadas só podem ser alteradas pelo setor financeiro',
      });
    }

    next();
  } catch (error) {
    console.error('❌ Erro no verifySaleOwnership:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar permissões',
    });
  }
};

/**
 * Middleware para validar hierarquia de equipe
 * Garante que líderes só possam gerenciar seus próprios subordinados
 */
export const verifyTeamHierarchy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;
    const targetUserId = req.body.user_id || req.params.memberId || req.params.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
    }

    // Admins têm acesso total
    if (isAdmin(currentUserRole)) {
      return next();
    }

    // Se não há targetUserId, é uma operação na própria equipe (listagem, stats)
    if (!targetUserId) {
      return next();
    }

    // Verificar se o target é subordinado direto do líder
    const result = await pool.query(
      'SELECT parent_id FROM users WHERE id = $1',
      [targetUserId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    const targetUser = result.rows[0];

    // Validar se o current user é o parent do target
    if (targetUser.parent_id !== currentUserId) {
      console.warn(
        `🚨 [SECURITY] Tentativa de manipulação de hierarquia: User ${currentUserId} tentou gerenciar User ${targetUserId} (parent: ${targetUser.parent_id})`
      );
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: você só pode gerenciar seus subordinados diretos',
      });
    }

    next();
  } catch (error) {
    console.error('❌ Erro no verifyTeamHierarchy:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar hierarquia',
    });
  }
};

/**
 * Middleware para validar parent_id em operações de equipe
 * Garante que o parent_id seja o próprio usuário ou admin
 */
export const verifyParentId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;
    const parentId = req.body.parent_id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
    }

    // Admins podem definir qualquer parent_id
    if (isAdmin(currentUserRole)) {
      return next();
    }

    // Se parent_id for fornecido, deve ser o próprio usuário
    if (parentId && parentId !== currentUserId) {
      console.warn(
        `🚨 [SECURITY] Tentativa de adicionar membro à equipe de outro: User ${currentUserId} tentou usar parent_id ${parentId}`
      );
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: você só pode adicionar membros à sua própria equipe',
      });
    }

    // Se não forneceu parent_id, força ser o currentUserId
    if (!parentId) {
      req.body.parent_id = currentUserId;
    }

    next();
  } catch (error) {
    console.error('❌ Erro no verifyParentId:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar parent_id',
    });
  }
};

/**
 * Middleware para verificar se usuário pode acessar comissões
 * Usuários só podem ver suas próprias comissões, exceto admins/financeiro
 */
export const verifyCommissionAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;
    const targetUserId = req.params.userId || req.query.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
    }

    // Financeiro, CEO e Admin podem ver todas as comissões
    if (isAdmin(currentUserRole) || currentUserRole === 'financeiro') {
      return next();
    }

    // Se não especificou userId, assume ser o próprio usuário
    if (!targetUserId) {
      return next();
    }

    // Usuário só pode ver suas próprias comissões
    if (targetUserId !== currentUserId) {
      console.warn(
        `🚨 [SECURITY] Tentativa de acesso não autorizado a comissões: User ${currentUserId} tentou acessar comissões de ${targetUserId}`
      );
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: você só pode acessar suas próprias comissões',
      });
    }

    next();
  } catch (error) {
    console.error('❌ Erro no verifyCommissionAccess:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar permissões',
    });
  }
};
