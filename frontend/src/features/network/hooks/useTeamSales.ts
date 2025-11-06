// src/features/network/hooks/useTeamSales.ts
import { useState, useEffect } from 'react';
import api from '@/services/api';

export const useTeamSales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/network/team-sales');

      if (response.data?.success) {
        setSales(response.data.data || []);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamSales();
  }, []);

  return {
    sales,
    loading,
    error,
    refresh: fetchTeamSales
  };
};
