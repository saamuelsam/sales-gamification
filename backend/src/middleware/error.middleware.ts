// backend/src/middleware/role.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@utils/responses';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return ApiResponse.forbidden(res, 'Acesso negado. Permissão insuficiente.');
    }

    next();
  };
};
