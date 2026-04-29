import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Filter, 
  Calendar, 
  User, 
  Building, 
  CheckCircle2,
  ChevronRight,
  BarChart2
} from 'lucide-react';
import { 
  getAtendimentoReport, 
  exportAtendimentoReport, 
  getUsers 
} from '../services/api';
import ClientSearchModal from '../components/ClientSearchModal';

const REPORT_OPTIONS = [
  { id: 'geral', label: 'Atendimentos', icon: FileText },
  { id: 'cliente', label: 'Clientes - Atendimentos', icon: Building, disabled: true },
  { id: 'modulos', label: 'Clientes - Módulos', icon: BarChart2, disabled: true },
];

const RelatoriosAtendimentos: React.FC = () => {
  const [activeReport, setActiveReport] = useState('geral');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [atendentes, setAtendentes] = useState<any[]>([]);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [atendenteId, setAtendenteId] = useState('');
  const [status, setStatus] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientSearch, setShowClientSearch] = useState(false);

  useEffect(() => {
    const loadAtendentes = async () => {
      try {
        const response = await getUsers();
        setAtendentes(response.data);
      } catch (error) {
        console.error('Erro ao carregar atendentes:', error);
      }
    };
    loadAtendentes();

    // Default dates (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {
        startDate,
        endDate,
        atendenteId,
        clienteId: selectedClient?.id,
        status
      };
      const response = await getAtendimentoReport(params);
      setResults(response.data);
    } catch (error: any) {
      alert(error.message || 'Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        startDate,
        endDate,
        atendenteId,
        clienteId: selectedClient?.id,
        status
      };
      const response = await exportAtendimentoReport(params);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_atendimentos_${startDate}_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      alert(error.message || 'Erro ao exportar relatório');
    }
  };

  return (
    <div className="text-white min-h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Relatórios Analíticos</h1>
        <p className="text-gray-500 text-sm">Visualize e extraia dados dos atendimentos realizados.</p>
      </div>

      <div className="flex flex-1 gap-8">
        {/* Sidebar de Opções de Relatório */}
        <div className="w-64 space-y-2">
          {REPORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => !option.disabled && setActiveReport(option.id)}
              disabled={option.disabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeReport === option.id 
                  ? 'bg-[#ed0c00] text-white shadow-lg shadow-[#ed0c00]/20' 
                  : option.disabled 
                    ? 'text-gray-700 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <option.icon size={18} />
              <span>{option.label}</span>
              {activeReport === option.id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 space-y-6">
          {/* Filtros */}
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6 text-gray-400">
              <Filter size={18} />
              <h2 className="text-sm font-bold uppercase tracking-widest">Filtros de Busca</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Calendar size={12} /> Período
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#ed0c00]"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#ed0c00]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <User size={12} /> Atendente
                  </label>
                  <select
                    value={atendenteId}
                    onChange={(e) => setAtendenteId(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#ed0c00] appearance-none"
                  >
                    <option value="">Todos os atendentes</option>
                    {atendentes.map((u) => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <CheckCircle2 size={12} /> Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#ed0c00] appearance-none"
                  >
                    <option value="">Todos os status</option>
                    <option value="ABERTO">Aberto</option>
                    <option value="ENCERRADO">Encerrado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Building size={12} /> Cliente
                  </label>
                  <div 
                    onClick={() => setShowClientSearch(true)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs cursor-pointer hover:border-white/20 transition-all flex items-center justify-between"
                  >
                    <span className={selectedClient ? 'text-white' : 'text-gray-500'}>
                      {selectedClient ? selectedClient.name : 'Filtrar por cliente...'}
                    </span>
                    {selectedClient && (
                      <XCircle 
                        size={14} 
                        className="text-gray-500 hover:text-red-500" 
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setSelectedClient(null);
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-white/5"
                  >
                    <Search size={14} />
                    {loading ? 'Buscando...' : 'Filtrar'}
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={results.length === 0}
                    className="flex-1 bg-[#ed0c00] hover:bg-[#ff0d00] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#ed0c00]/20"
                  >
                    <Download size={14} />
                    Exportar Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Resultados */}
          <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/5 text-gray-400 border-b border-white/10">
                    <th className="px-6 py-4 font-bold uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider">Atendente</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider">Data Início</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-right">Duração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                        {loading ? 'Carregando resultados...' : 'Nenhum resultado encontrado para os filtros selecionados.'}
                      </td>
                    </tr>
                  ) : (
                    results.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-500">#{row.id.toString().padStart(5, '0')}</td>
                        <td className="px-6 py-4 font-medium text-gray-200">{row.cliente}</td>
                        <td className="px-6 py-4 text-gray-400">{row.atendente}</td>
                        <td className="px-6 py-4 text-gray-400">{row.data_inicio}</td>
                        <td className="px-6 py-4">
                          <span className="bg-white/5 px-2 py-1 rounded-md text-[10px] font-bold text-gray-300">
                            {row.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            row.status === 'ABERTO' ? 'bg-yellow-500/10 text-yellow-500' :
                            row.status === 'ENCERRADO' ? 'bg-green-500/10 text-green-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-400">
                          {row.tempo_decorrido ? `${row.tempo_decorrido} min` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {results.length > 0 && (
              <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex justify-between items-center">
                <span className="text-gray-500">Total de registros: <strong>{results.length}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showClientSearch && (
        <ClientSearchModal 
          onClose={() => setShowClientSearch(false)}
          onSelect={(client) => {
            setSelectedClient(client);
            setShowClientSearch(false);
          }}
          onRegisterNew={() => {}} // Disabled here
        />
      )}
    </div>
  );
};

// Sub-component to help with icons that were not imported but used in thought process
const XCircle = ({ size, className, onClick }: { size: number; className?: string; onClick: (e: React.MouseEvent) => void }) => (
  <XCircleIcon size={size} className={className} onClick={onClick} />
);
import { XCircle as XCircleIcon } from 'lucide-react';

export default RelatoriosAtendimentos;
