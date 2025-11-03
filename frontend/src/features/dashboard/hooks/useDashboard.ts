// frontend/src/features/dashboard/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import api  from '@/services/api';

export interface DashboardPersonal {
  sales: {
    total_sales: number;
    total_revenue: number;
    total_kilowatts: number;
    average_sale_value: number;
  };
  points: {
    total_points: number;
  };
  commissions: {
    total_commissions: number;
    pending_commissions: number;
    paid_commissions: number;
  };
  level: {
    id: string;
    name: string;
    phase_number: number;
    points_required: number;
  } | null;
}

export const useDashboard = () => {
  return useQuery<DashboardPersonal>({
    queryKey: ['dashboard', 'personal'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/dashboard/personal');
        console.log('Dashboard data:', data);
        
        // Garantir que os valores são números
        return {
          ...data,
          sales: {
            total_sales: Number(data?.sales?.total_sales) || 0,
            total_revenue: Number(data?.sales?.total_revenue) || 0,
            total_kilowatts: Number(data?.sales?.total_kilowatts) || 0,
            average_sale_value: Number(data?.sales?.average_sale_value) || 0,
          },
          points: {
            total_points: Number(data?.points?.total_points) || 0,
          },
          commissions: {
            total_commissions: Number(data?.commissions?.total_commissions) || 0,
            pending_commissions: Number(data?.commissions?.pending_commissions) || 0,
            paid_commissions: Number(data?.commissions?.paid_commissions) || 0,
          },
        };
      } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });
};
