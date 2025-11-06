import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

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
  team_members?: number;
}

// ✅ Chave única para identificar esta query
export const DASHBOARD_QUERY_KEY = ['dashboard', 'personal'] as const;

export const useDashboard = () => {
  return useQuery<DashboardPersonal>({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: async () => {
      try {
        const { data } = await api.get('/dashboard/personal');
        console.log('Dashboard data:', data);
        
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
          team_members: Number(data?.team_members) || 0,
        };
      } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutos (abaixa pra mais curto)
    gcTime: 1000 * 60 * 5,    // 5 minutos
    refetchOnWindowFocus: true,
  });
};

// ✅ Hook para invalidar o cache (NOVO!)
export const useInvalidateDashboard = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEY,
    });
  };
};
