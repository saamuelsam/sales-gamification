// frontend/src/features/commissions/hooks/useCommissions.ts
import { useState, useEffect } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';

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

interface CommissionSummary {
  total_commissions: number;
  unpaid_commissions: number;
  paid_commissions: number;
  total_unpaid: number;
  total_paid: number;
  total_earned: number;
}

interface MonthlyCommission {
  month: string;
  amount: number;
}

export const useCommissions = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyCommission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      
      // ✅ Buscar comissões, resumo e dados mensais em paralelo
      const [commissionsRes, summaryRes, monthlyRes] = await Promise.all([
        api.get('/commissions/network'),
        api.get('/commissions/summary'),
        api.get('/commissions/monthly') // ✅ Nova rota
      ]);

      // Extrair dados
      const commissionsData = commissionsRes.data?.data || [];
      const summaryData = summaryRes.data?.data || null;
      const monthlyDataResponse = monthlyRes.data?.data || [];

      setCommissions(commissionsData);
      setSummary(summaryData);
      setMonthlyData(monthlyDataResponse);

      console.log('✅ Comissões carregadas:', commissionsData.length);
      console.log('✅ Dados mensais:', monthlyDataResponse);
    } catch (error: any) {
      console.error('❌ Erro ao carregar comissões:', error);
      toast.error('Erro ao carregar comissões');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (commissionId: string) => {
    try {
      await api.patch(`/commissions/${commissionId}/mark-paid`);
      toast.success('Comissão marcada como paga!');
      await fetchCommissions(); // Recarregar dados
    } catch (error: any) {
      console.error('❌ Erro ao marcar comissão:', error);
      toast.error('Erro ao marcar comissão como paga');
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  return {
    commissions,
    summary,
    monthlyData, // ✅ Exportar dados mensais
    loading,
    markAsPaid,
    refresh: fetchCommissions
  };
};
