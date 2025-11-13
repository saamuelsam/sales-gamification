import api from '@/services/api';

/**
 * Atualiza o status de uma venda e gera comissões (quando aprovado)
 */
export const updateSaleStatus = async (saleId: string, status: string) => {
  try {
    const response = await api.put(`/sales/${saleId}/status`, { status });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao atualizar status da venda:', error);
    throw error;
  }
};
