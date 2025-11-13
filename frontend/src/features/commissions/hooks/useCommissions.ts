import { useState, useEffect } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore'; // ✅ importa o store de autenticação

interface Commission {
  id: string;
  team_member_name: string;
  team_member_email: string;
  commission_amount: number;
  commission_percentage: number;
  paid: boolean;
  paid_at?: string;
  created_at: string;
}

interface CommissionDetail {
  total_commissions: number;
  unpaid_commissions: number;
  paid_commissions: number;
  total_unpaid: number;
  total_paid: number;
  total_earned: number;
}

interface CommissionSummary {
  personal?: CommissionDetail;
  network?: CommissionDetail;
  total_earned?: number;
  total_paid?: number;
  total_pending?: number;
  // Backward compatibility
  total_commissions?: number;
  unpaid_commissions?: number;
  paid_commissions?: number;
  total_unpaid?: number;
}

interface MonthlyCommission {
  month: string;
  amount: number;
}

export const useCommissions = () => {
  const { user } = useAuthStore(); // ✅ obtém o usuário logado
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyCommission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommissions = async () => {
    try {
      if (!user?.id) {
        console.warn('⚠️ Nenhum user.id encontrado, abortando busca de comissões');
        return;
      }

      setLoading(true);

      console.log('👤 user.id do front:', user.id);

      // ✅ Envia o ID do usuário para o backend
      const [commissionsRes, summaryRes, monthlyRes] = await Promise.all([
        api.get('/commissions/network', { params: { userId: user.id } }),
        api.get('/commissions/summary', { params: { userId: user.id } }),
        api.get('/commissions/monthly', { params: { userId: user.id } })
      ])

      // ✅ Extrair dados com validação segura
      const data = commissionsRes.data?.data;
      const summaryData = summaryRes.data?.data || summaryRes.data || null;
      const monthlyDataResponse = monthlyRes.data?.data || monthlyRes.data || [];

      setCommissions(Array.isArray(data) ? data : []);
      setSummary(summaryData);
      setMonthlyData(Array.isArray(monthlyDataResponse) ? monthlyDataResponse : []);

      console.log('🧠 Comissões recebidas da API:', summaryData);
      console.log('✅ Comissões carregadas:', Array.isArray(data) ? data.length : 0);
      console.log('✅ Dados mensais:', monthlyDataResponse);
    } catch (error: any) {
      console.error('❌ Erro ao carregar comissões:', error);
      toast.error('Erro ao carregar comissões');
      setCommissions([]);
      setMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (commissionId: string) => {
    try {
      await api.patch(`/commissions/${commissionId}/mark-paid`);
      toast.success('Comissão marcada como paga!');
      await fetchCommissions();
    } catch (error: any) {
      console.error('❌ Erro ao marcar comissão:', error);
      toast.error('Erro ao marcar comissão como paga');
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [user?.id]); // ✅ dispara novamente se o usuário mudar

  return {
    commissions,
    summary,
    monthlyData,
    loading,
    markAsPaid,
    refresh: fetchCommissions
  };
};
