import api from '@/services/api';
import { canSetStatus, SaleStatus } from '../utils/statusPermissions';

interface UpdateStatusParams {
  saleId: string;
  status: SaleStatus;
  userRole?: string;
}

/**
 * Atualiza o status de uma venda com validação de permissões
 * @throws Error se o usuário não tiver permissão para definir o status
 */
export const updateSaleStatus = async ({ saleId, status, userRole }: UpdateStatusParams) => {
  // 🔒 Validação no frontend antes de enviar para o backend
  if (!canSetStatus(userRole, status)) {
    throw new Error('❌ Você não tem permissão para aprovar vendas. Apenas o departamento financeiro, CEO e Admin podem aprovar.');
  }

  try {
    const response = await api.put(`/sales/${saleId}/status`, { status });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao atualizar status da venda:', error);
    
    // Se o backend retornar erro de permissão, mostrar mensagem específica
    if (error.response?.status === 403) {
      throw new Error(error.response?.data?.message || 'Você não tem permissão para realizar esta ação');
    }
    throw error;
  }
};

/**
 * Atualiza dados gerais de uma venda (incluindo status se fornecido)
 */
export const updateSale = async (saleId: string, data: any, userRole?: string) => {
  // 🔒 Se está tentando alterar o status, validar permissão
  if (data.status && !canSetStatus(userRole, data.status as SaleStatus)) {
    throw new Error('❌ Você não tem permissão para aprovar vendas. Apenas o departamento financeiro, CEO e Admin podem aprovar.');
  }

  try {
    const response = await api.put(`/sales/${saleId}`, data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error(error.response?.data?.message || 'Você não tem permissão para realizar esta ação');
    }
    throw error;
  }
};
