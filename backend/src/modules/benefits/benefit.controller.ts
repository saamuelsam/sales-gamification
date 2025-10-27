// backend/src/modules/benefits/benefit.controller.ts

import { Request, Response } from 'express';
import { BenefitService } from './benefit.service';
import { ApiResponse } from '@utils/responses';

const benefitService = new BenefitService();

export class BenefitController {
  async list(req: Request, res: Response) {
    try {
      const benefits = await benefitService.getAllBenefits();
      return ApiResponse.success(res, benefits, 'Lista de benefícios');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getByLevel(req: Request, res: Response) {
    try {
      const benefits = await benefitService.getBenefitsByLevel(req.params.levelId);
      return ApiResponse.success(res, benefits);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getUserBenefits(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.user.userId;
      const benefits = await benefitService.getUserUnlockedBenefits(userId);
      return ApiResponse.success(res, benefits, 'Benefícios desbloqueados');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const benefit = await benefitService.createBenefit(req.body);
      return ApiResponse.created(res, benefit, 'Benefício criado');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const benefit = await benefitService.updateBenefit(req.params.id, req.body);
      return ApiResponse.success(res, benefit, 'Benefício atualizado');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const message = await benefitService.deleteBenefit(req.params.id);
      return ApiResponse.success(res, message);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}
