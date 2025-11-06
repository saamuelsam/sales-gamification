// src/features/commissions/hooks/useCommissions.ts
import { useState, useEffect } from 'react';
import api from '@/services/api';

export const useCommissions = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Buscando comissões...');

      // Buscar comissões de rede
      const commissionsResponse = await api.get('/commissions/network');
      console.log('✅ Resposta comissões:', commissionsResponse.data);

      if (commissionsResponse.data?.success) {
        const data = commissionsResponse.data.data || [];
        console.log(`✅ ${data.length} comissões encontradas`);
        setCommissions(data);
      }

      // Buscar resumo
      const summaryResponse = await api.get('/commissions/summary');
      console.log('✅ Resposta resumo:', summaryResponse.data);

      if (summaryResponse.data?.success) {
        console.log('✅ Resumo carregado:', summaryResponse.data.data);
        setSummary(summaryResponse.data.data);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Erro desconhecido';
      console.error('❌ Erro:', errorMsg);
      setError(errorMsg);
      setCommissions([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const markAsPaid = async (commissionId: string) => {
    try {
      console.log(`✅ Marcando ${commissionId} como paga...`);
      await api.put(`/commissions/${commissionId}/mark-paid`);
      console.log('✅ Marcado com sucesso');
      await fetchCommissions(); // Recarregar
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      console.error('❌ Erro:', errorMsg);
      setError(errorMsg);
    }
  };

  return {
    commissions,
    summary,
    loading,
    error,
    markAsPaid,
    refresh: fetchCommissions
  };
};
