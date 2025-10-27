// src/features/team/pages/TeamPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import api from '@/services/api';
import { Users, UserPlus, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export const TeamPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const { data: team, isLoading, refetch } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const { data } = await api.get('/users/team/members');
      return data.data;
    },
  });

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users/team/add', formData);
      toast.success('Membro adicionado com sucesso!');
      setShowAddForm(false);
      setFormData({ name: '', email: '', password: '' });
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao adicionar membro');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-600" />
            Minha Equipe
          </h1>
          <p className="text-gray-600 mt-1">Gerencie seus membros diretos</p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </div>

      {showAddForm && (
        <Card title="Adicionar Novo Membro">
          <form onSubmit={handleAddMember} className="space-y-4">
            <input
              type="text"
              placeholder="Nome completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="Senha temporária"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
            <Button type="submit" fullWidth>Adicionar Membro</Button>
          </form>
        </Card>
      )}

      <div className="grid gap-4">
        {team?.map((member: any) => (
          <Card key={member.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-yellow-600">
                  <Award className="w-4 h-4" />
                  <span className="font-semibold">{member.total_points}</span>
                </div>
                <p className="text-xs text-gray-600">{member.total_sales} vendas</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {team?.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Você ainda não tem membros na sua equipe</p>
          <Button onClick={() => setShowAddForm(true)} className="mt-4">
            Adicionar Primeiro Membro
          </Button>
        </div>
      )}
    </div>
  );
};
