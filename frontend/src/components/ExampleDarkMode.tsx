// Exemplo de componente adaptado para Dark Mode

import { useTheme } from '@/contexts/ThemeContext';

export function ExampleComponent() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-page"> {/* Usa classe utilitária */}
      
      {/* Container Principal */}
      <div className="container mx-auto p-6">
        
        {/* Card Exemplo 1 - Usando classe utilitária */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Dashboard
          </h2>
          <p className="text-muted">
            Este é um exemplo de card com dark mode automático
          </p>
        </div>

        {/* Card Exemplo 2 - Usando classes Tailwind diretas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Estatísticas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stat Card */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">R$ 10.000</p>
            </div>
          </div>
        </div>

        {/* Formulário Exemplo */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Formulário
          </h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-primary dark:focus:ring-highlight focus:border-transparent
                         transition-colors"
                placeholder="Digite seu nome"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="btn-primary"
              >
                Salvar
              </button>
              <button
                type="button"
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        {/* Tabela Exemplo */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Lista
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    Exemplo 1
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span className="badge badge-success">Ativo</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    R$ 1.000
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    Exemplo 2
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span className="badge badge-warning">Pendente</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    R$ 2.000
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Badges Exemplo */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Status Badges
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-success">Sucesso</span>
            <span className="badge badge-warning">Aviso</span>
            <span className="badge badge-danger">Erro</span>
            <span className="badge badge-info">Info</span>
          </div>
        </div>

        {/* Informação sobre tema atual */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 Tema atual: <strong className="font-semibold">{theme}</strong>
          </p>
        </div>

      </div>
    </div>
  );
}
