// frontend/src/features/ceo/pages/CeoManagementPage.tsx
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  User,
  Shield,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Award,
  Search,
  Filter,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  RefreshCw,
  Lock,
  Users,
  DollarSign,
  Activity
} from 'lucide-react';

interface Consultant {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  is_active: boolean;
  created_at: string;
  parent_name?: string;
  total_sales: number;
  total_revenue: number;
  team_size: number;
  total_commissions: number;
}

interface ConsultantDetails {
  user: Consultant & {
    personal_commissions: number;
    network_commissions: number;
  };
  team: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    points: number;
    is_active: boolean;
  }>;
  recent_sales: Array<{
    id: string;
    value: number;
    kilowatts: number;
    status: string;
    created_at: string;
    client_name: string;
  }>;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  current_level: string;
  accumulated_points: number;
  manager_name?: string;
  manager_id?: string;
  director_name?: string;
  director_id?: string;
  direct_reports: number;
  clients_count: number;
  total_sales_value: number;
  sales_count: number;
}

export function CeoManagementPage() {
  // Tabs
  const [activeTab, setActiveTab] = useState<'consultants' | 'team'>('consultants');
  
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<ConsultantDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  // Modais
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Forms
  const [editForm, setEditForm] = useState<Partial<Consultant>>({});
  const [pointsForm, setPointsForm] = useState({ points: 0, reason: '' });
  const [saleForm, setSaleForm] = useState({
    client_name: '',
    client_cpf: '',
    client_phone: '',
    client_email: '',
    value: 0,
    kilowatts: 0,
    notes: '',
  });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '' });

  useEffect(() => {
    if (activeTab === 'consultants') {
      fetchConsultants();
    } else if (activeTab === 'team') {
      fetchTeamMembers();
    }
  }, [roleFilter, activeFilter, activeTab]);

  const fetchConsultants = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      if (activeFilter !== undefined) params.active = activeFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/ceo/consultants', { params });
      setConsultants(res.data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar consultores:', error);
      toast.error('Erro ao carregar consultores');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ceo/team');
      setTeamMembers(res.data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
      toast.error('Erro ao carregar equipe');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultantDetails = async (id: string) => {
    try {
      const res = await api.get(`/ceo/consultants/${id}`);
      setSelectedConsultant(res.data?.data || null);
      setShowDetails(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes do consultor');
    }
  };

  const handleUpdateConsultant = async () => {
    if (!selectedConsultant) return;
    
    try {
      await api.put(`/ceo/consultants/${selectedConsultant.user.id}`, editForm);
      toast.success('Consultor atualizado com sucesso');
      setShowEditModal(false);
      fetchConsultants();
      fetchConsultantDetails(selectedConsultant.user.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar consultor');
    }
  };

  const handleChangeRole = async (newRole: string) => {
    if (!selectedConsultant) return;
    
    try {
      await api.patch(`/ceo/consultants/${selectedConsultant.user.id}/role`, { role: newRole });
      toast.success('Cargo alterado com sucesso');
      fetchConsultants();
      fetchConsultantDetails(selectedConsultant.user.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar cargo');
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedConsultant || !pointsForm.reason) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    try {
      await api.patch(`/ceo/consultants/${selectedConsultant.user.id}/points`, pointsForm);
      toast.success('Pontos ajustados com sucesso');
      setShowPointsModal(false);
      setPointsForm({ points: 0, reason: '' });
      
      // Recarregar dados
      await fetchConsultants();
      await fetchConsultantDetails(selectedConsultant.user.id);
    } catch (error: any) {
      console.error('Erro ao ajustar pontos:', error);
      toast.error(error.response?.data?.message || 'Erro ao ajustar pontos');
    }
  };

  const handleCreateSale = async () => {
    if (!selectedConsultant || !saleForm.client_name || !saleForm.value || !saleForm.kilowatts) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      await api.post(`/ceo/consultants/${selectedConsultant.user.id}/sales`, saleForm);
      toast.success('Venda criada com sucesso');
      setShowSaleModal(false);
      setSaleForm({ client_name: '', client_cpf: '', client_phone: '', client_email: '', value: 0, kilowatts: 0, notes: '' });
      fetchConsultants();
      fetchConsultantDetails(selectedConsultant.user.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar venda');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/ceo/consultants/${id}/toggle-status`);
      toast.success('Status alterado com sucesso');
      fetchConsultants();
      if (selectedConsultant && selectedConsultant.user.id === id) {
        fetchConsultantDetails(id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedConsultant || !passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    
    try {
      await api.post(`/ceo/consultants/${selectedConsultant.user.id}/reset-password`, passwordForm);
      toast.success('Senha resetada com sucesso');
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao resetar senha');
    }
  };

  const roleLabels: Record<string, string> = {
    consultant: 'Consultor',
    master_consultant: 'Master Consultant',
    senior_consultant: 'Consultor Sênior',
    prime_consultant: 'Consultor Prime',
    executive: 'Executivo',
    director: 'Diretor',
    diretor_comercial: 'Diretor Comercial',
    admin: 'Administrador',
    financeiro: 'Financeiro',
    ceo: 'CEO',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Gestão CEO
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Controle total sobre todos os consultores e suas atividades
          </p>
        </div>
        <button
          onClick={activeTab === 'consultants' ? fetchConsultants : fetchTeamMembers}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('consultants')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'consultants'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Consultores
          </div>
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'team'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Hierarquia da Equipe
          </div>
        </button>
      </div>

      {/* Conteúdo da aba Consultores */}
      {activeTab === 'consultants' && (
        <>
          {/* Filtros */}
          <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchConsultants()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filtro de Cargo */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Todos os cargos</option>
            {Object.entries(roleLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Filtro de Status */}
          <select
            value={activeFilter === undefined ? '' : activeFilter ? 'true' : 'false'}
            onChange={(e) =>
              setActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')
            }
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Todos os status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>

          {/* Botão Aplicar */}
          <button
            onClick={fetchConsultants}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Filter className="w-4 h-4" />
            Aplicar Filtros
          </button>
        </div>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Consultores</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{consultants.length}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
              <p className="text-2xl font-bold text-green-600">
                {consultants.filter((c) => c.is_active).length}
              </p>
            </div>
            <UserCheck className="w-10 h-10 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Vendas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {consultants.reduce((acc, c) => acc + c.total_sales, 0)}
              </p>
            </div>
            <ShoppingCart className="w-10 h-10 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {consultants.reduce((acc, c) => acc + parseFloat(String(c.total_revenue)), 0).toLocaleString('pt-BR')}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Lista de Consultores */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Consultor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Pontos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Vendas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Receita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : consultants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhum consultor encontrado
                  </td>
                </tr>
              ) : (
                consultants.map((consultant) => (
                  <tr
                    key={consultant.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => fetchConsultantDetails(consultant.id)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{consultant.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{consultant.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {roleLabels[consultant.role] || consultant.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {consultant.points?.toLocaleString('pt-BR') || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{consultant.total_sales}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      R$ {parseFloat(String(consultant.total_revenue)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      {consultant.is_active ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <UserCheck className="w-4 h-4" />
                          Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <UserX className="w-4 h-4" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(consultant.id);
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          title={consultant.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {consultant.is_active ? (
                            <UserX className="w-4 h-4 text-red-600" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchConsultantDetails(consultant.id);
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          title="Ver detalhes"
                        >
                          <Activity className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      )}

      {/* Conteúdo da aba Equipe */}
      {activeTab === 'team' && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Hierarquia Completa da Equipe
          </h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum membro encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cargo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Patrocinador</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Subordinados</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Clientes</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Vendas</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Receita Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pontos</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === 'CEO' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          member.role === 'DIRETOR_COMERCIAL' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          member.role === 'GERENTE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {roleLabels[member.role.toLowerCase()] || member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {member.manager_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                        {member.direct_reports}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                        {member.clients_count}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {member.sales_count}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        R$ {Number(member.total_sales_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {member.accumulated_points || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {member.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal de Detalhes - será implementado na próxima parte */}
      {showDetails && selectedConsultant && (
        <ConsultantDetailsModal
          consultant={selectedConsultant}
          onClose={() => setShowDetails(false)}
          onEdit={() => {
            setEditForm(selectedConsultant.user);
            setShowEditModal(true);
          }}
          onAdjustPoints={() => setShowPointsModal(true)}
          onCreateSale={() => setShowSaleModal(true)}
          onResetPassword={() => setShowPasswordModal(true)}
          onChangeRole={handleChangeRole}
          roleLabels={roleLabels}
        />
      )}

      {/* Modal de Edição */}
      {showEditModal && selectedConsultant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Editar Consultor
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cargo
                </label>
                <select
                  value={editForm.role || ''}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="consultant">Consultor</option>
                  <option value="master_consultant">Master Consultant</option>
                  <option value="senior_consultant">Consultor Sênior</option>
                  <option value="prime_consultant">Consultor Prime</option>
                  <option value="executive">Executivo</option>
                  <option value="director">Diretor</option>
                  <option value="diretor_comercial">Diretor Comercial</option>
                  <option value="admin">Administrador</option>
                  <option value="financeiro">Financeiro</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateConsultant}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Pontos */}
      {showPointsModal && selectedConsultant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Ajustar Pontos
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pontos (+ para adicionar, - para remover)
                </label>
                <input
                  type="number"
                  value={pointsForm.points}
                  onChange={(e) => setPointsForm({ ...pointsForm, points: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 100 ou -50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo *
                </label>
                <textarea
                  value={pointsForm.reason}
                  onChange={(e) => setPointsForm({ ...pointsForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Explique o motivo do ajuste..."
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAdjustPoints}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setShowPointsModal(false);
                    setPointsForm({ points: 0, reason: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criar Venda */}
      {showSaleModal && selectedConsultant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Criar Venda para {selectedConsultant.user.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={saleForm.client_name}
                  onChange={(e) => setSaleForm({ ...saleForm, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="João da Silva"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CPF (Opcional)
                </label>
                <input
                  type="text"
                  value={saleForm.client_cpf}
                  onChange={(e) => setSaleForm({ ...saleForm, client_cpf: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone (Opcional)
                </label>
                <input
                  type="text"
                  value={saleForm.client_phone}
                  onChange={(e) => setSaleForm({ ...saleForm, client_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="(11) 98765-4321"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  value={saleForm.client_email}
                  onChange={(e) => setSaleForm({ ...saleForm, client_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="joao@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={saleForm.value}
                  onChange={(e) => setSaleForm({ ...saleForm, value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="50000.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kilowatts (kWp) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={saleForm.kilowatts}
                  onChange={(e) => setSaleForm({ ...saleForm, kilowatts: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="10.5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Detalhes adicionais..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateSale}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Criar Venda
                </button>
                <button
                  onClick={() => {
                    setShowSaleModal(false);
                    setSaleForm({ client_name: '', client_cpf: '', client_phone: '', client_email: '', value: 0, kilowatts: 0, notes: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resetar Senha */}
      {showPasswordModal && selectedConsultant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Resetar Senha
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nova Senha *
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Digite a nova senha..."
                  required
                  minLength={6}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                A senha será alterada para o usuário <strong>{selectedConsultant.user.email}</strong>
              </p>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleResetPassword}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Resetar
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ newPassword: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Modal de Detalhes (continuação na próxima parte)
function ConsultantDetailsModal({
  consultant,
  onClose,
  onEdit,
  onAdjustPoints,
  onCreateSale,
  onResetPassword,
  onChangeRole,
  roleLabels,
}: {
  consultant: ConsultantDetails;
  onClose: () => void;
  onEdit: () => void;
  onAdjustPoints: () => void;
  onCreateSale: () => void;
  onResetPassword: () => void;
  onChangeRole: (role: string) => void;
  roleLabels: Record<string, string>;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {consultant.user.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-white">{consultant.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargo</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {roleLabels[consultant.user.role] || consultant.user.role}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pontos</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {consultant.user.points?.toLocaleString('pt-BR') || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {consultant.user.is_active ? 'Ativo' : 'Inativo'}
              </p>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Vendas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {consultant.user.total_sales}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Receita</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {parseFloat(String(consultant.user.total_revenue)).toLocaleString('pt-BR')}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tamanho da Equipe</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {consultant.user.team_size}
              </p>
            </Card>
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={onAdjustPoints}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Award className="w-4 h-4" />
              Ajustar Pontos
            </button>
            <button
              onClick={onCreateSale}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ShoppingCart className="w-4 h-4" />
              Criar Venda
            </button>
            <button
              onClick={onResetPassword}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Lock className="w-4 h-4" />
              Resetar Senha
            </button>
          </div>

          {/* Vendas Recentes */}
          {consultant.recent_sales.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Vendas Recentes
              </h3>
              <div className="space-y-2">
                {consultant.recent_sales.map((sale) => (
                  <Card key={sale.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {sale.client_name || 'Cliente não identificado'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          R$ {parseFloat(String(sale.value)).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {sale.kilowatts} kW
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
