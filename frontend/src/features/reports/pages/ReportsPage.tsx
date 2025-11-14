import { useState} from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp,
  Users,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Filter
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const reports = [
    {
      id: 'sales',
      title: 'Relatório de Vendas',
      description: 'Detalhamento completo de todas as vendas realizadas no período',
      icon: TrendingUp,
      color: 'blue',
      available: true
    },
    {
      id: 'commissions',
      title: 'Relatório de Comissões',
      description: 'Comissões pagas e pendentes por consultor',
      icon: DollarSign,
      color: 'green',
      available: true
    },
    {
      id: 'team',
      title: 'Relatório de Equipe',
      description: 'Performance individual e coletiva dos consultores',
      icon: Users,
      color: 'purple',
      available: true
    },
    {
      id: 'goals',
      title: 'Relatório de Metas',
      description: 'Acompanhamento de metas individuais e coletivas',
      icon: Target,
      color: 'orange',
      available: true
    },
    {
      id: 'analytics',
      title: 'Análise Gerencial',
      description: 'Dashboard executivo com KPIs e indicadores',
      icon: BarChart3,
      color: 'cyan',
      available: false
    },
    {
      id: 'financial',
      title: 'Relatório Financeiro',
      description: 'Análise financeira consolidada do período',
      icon: PieChart,
      color: 'red',
      available: false
    }
  ];

  const handleDownloadReport = async (reportId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      console.log('📥 Baixando relatório:', reportId);
      console.log('📅 Período:', dateRange);
      
      const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
      const url = `${baseURL}/admin/reports/${reportId}?start=${dateRange.start}&end=${dateRange.end}`;
      console.log('🌐 URL:', url);
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', response.headers);

      if (response.ok) {
        const text = await response.text();
        console.log('📄 Conteúdo recebido (primeiros 500 chars):', text.substring(0, 500));
        console.log('📏 Tamanho total:', text.length, 'caracteres');
        
        if (text.length < 100) {
          toast.error('Relatório vazio ou sem dados no período selecionado');
          return;
        }
        
        const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_${reportId}_${dateRange.start}_${dateRange.end}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Relatório baixado com sucesso!');
      } else {
        const errorText = await response.text();
        console.error('❌ Erro:', errorText);
        toast.error('Erro ao gerar relatório: ' + response.status);
      }
    } catch (error) {
      console.error('❌ Erro ao baixar relatório:', error);
      toast.error('Erro ao baixar relatório');
    } finally {
      setLoading(false);
    }
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      icon: 'text-green-600 dark:text-green-400',
      button: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      icon: 'text-purple-600 dark:text-purple-400',
      button: 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      icon: 'text-orange-600 dark:text-orange-400',
      button: 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600'
    },
    cyan: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      icon: 'text-cyan-600 dark:text-cyan-400',
      button: 'bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      icon: 'text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          Relatórios
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gere relatórios detalhados sobre vendas, comissões e performance
        </p>
      </div>

      {/* Filtro de Período */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Período</h3>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data Inicial
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data Final
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        </div>
      </Card>

      {/* Grid de Relatórios */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          const colors = colorClasses[report.color as keyof typeof colorClasses];

          return (
            <Card 
              key={report.id} 
              className={`p-6 ${!report.available ? 'opacity-60' : 'hover:shadow-lg'} transition-all`}
            >
              <div className="flex flex-col h-full">
                {/* Ícone */}
                <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-7 h-7 ${colors.icon}`} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {report.description}
                  </p>
                </div>

                {/* Ações */}
                <div className="mt-4">
                  {report.available ? (
                    <button
                      onClick={() => handleDownloadReport(report.id)}
                      disabled={loading}
                      className={`w-full ${colors.button} text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Download className="w-4 h-4" />
                      {loading ? 'Gerando...' : 'Baixar Relatório'}
                    </button>
                  ) : (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg font-medium text-center">
                      Em Breve
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
              Sobre os Relatórios
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Os relatórios são gerados no formato CSV e podem ser abertos no Excel ou Google Sheets. 
              Selecione o período desejado e clique em "Baixar Relatório" para gerar o arquivo.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
