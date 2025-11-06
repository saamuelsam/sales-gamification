// src/features/network/hooks/useTeamSales.ts
import { useState, useEffect } from 'react';
import api from '@/services/api';

export const useTeamSales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar vendas
      const salesResponse = await api.get('/network/team-sales');
      if (salesResponse.data?.success) {
        setSales(salesResponse.data.data || []);
      }

      // Buscar resumo de comissões
      const summaryResponse = await api.get('/network/commissions-summary');
      if (summaryResponse.data?.success) {
        setSummary(summaryResponse.data.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      setSales([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamSales();
  }, []);

  return {
    sales,
    summary,
    loading,
    error,
    refresh: fetchTeamSales
  };
};
