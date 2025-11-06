// src/features/team/hooks/useTeam.ts
import { useState, useEffect } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  total_points: number;
  total_sales: number;
  sales_count?: number;
  total_revenue?: number;
  is_active?: boolean;
  created_at?: string;
}

interface TeamStats {
  total_members: number;
  total_team_sales: number;
  total_team_sales_count: number;
  total_team_points: number;
}

export const useTeam = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/team/members');
      const membersData = response.data?.data || [];

      // Transformar dados para o formato esperado
      const transformedMembers = membersData.map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        total_points: parseInt(member.total_points) || 0,
        total_sales: parseInt(member.sales_count) || 0,
        sales_count: parseInt(member.sales_count) || 0,
        total_revenue: parseFloat(member.total_sales) || 0,
        is_active: member.is_active,
        created_at: member.created_at,
      }));

      setMembers(transformedMembers);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erro ao carregar membros';
      setError(errorMsg);
      console.error('Erro ao buscar membros:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/team/stats');
      setStats(response.data?.data || null);
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  };

  const fetchAll = async () => {
    await Promise.all([fetchMembers(), fetchStats()]);
  };

  // Buscar dados ao montar o componente
  useEffect(() => {
    fetchAll();
  }, []);

  const addMember = async (name: string, email: string) => {
    try {
      await api.post('/team/members', { name, email });
      toast.success('Membro adicionado com sucesso!');
      await fetchAll();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erro ao adicionar membro';
      toast.error(errorMsg);
      throw err;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      await api.delete(`/team/members/${memberId}`);
      toast.success('Membro removido com sucesso!');
      await fetchAll();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erro ao remover membro';
      toast.error(errorMsg);
      throw err;
    }
  };

  const refresh = () => {
    fetchAll();
  };

  return {
    members,
    stats,
    loading,
    error,
    addMember,
    removeMember,
    refresh,
  };
};
