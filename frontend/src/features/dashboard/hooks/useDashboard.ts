// src/features/dashboard/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/complete');
      return data.data;
    },
  });
};
