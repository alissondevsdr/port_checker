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
  BarChart2,
  XCircle,
  Eye
} from 'lucide-react';
import { 
  getAtendimentoReport, 
  exportAtendimentoReport, 
  getUsers 
} from '../services/api';
import ClientSearchModal from '../components/ClientSearchModal';
import AtendimentoHistoryModal from '../components/AtendimentoHistoryModal';
import Skeleton from '../components/Skeleton';

const REPORT_OPTIONS = [
  { id: 'geral', label: 'Atendimentos', icon: FileText, desc: 'Relatório detalhado de todos os atendimentos' },
  { id: 'cliente', label: 'Clientes - Atendimentos', icon: Building, disabled: true, desc: 'Ranking de atendimentos por cliente' },
  { id: 'modulos', label: 'Clientes - Módulos', icon: BarChart2, disabled: true, desc: 'Distribuição de módulos por cliente' },
];

const RelatoriosAtendimentos: React.FC = () => {
  const [activeReport, setActiveReport] = useState('geral');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [atendentes, setAtendentes] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{title: string, msg: string, type: 'success' | 'danger'} | null>(null);
  const [selectedAtendimentoId, setSelectedAtendimentoId] = useState<number | null>(null);
  
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
    setFeedback(null);
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
      setFeedback({ title: 'Erro de Busca', msg: error.message || 'Erro ao buscar dados', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setFeedback(null);
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
      setFeedback({ title: 'Erro na Exportação', msg: error.message || 'Erro ao exportar relatório', type: 'danger' });
    }
  };

  return (
    <div className="text-white min-h-[calc(100vh-100px)] flex flex-col pb-12 max-w-[1400px] mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-bold">Relatórios Analíticos</h1>
        <p className="text-gray-500 text-sm">Visualize e extraia dados dos atendimentos realizados para análise de performance.</p>
      </div>

      {feedback && (
        <div className="fixed bottom-8 right-8 z-[10001] animate-in slide-in-from-right duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            feedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <div>
              <div className="font-bold text-sm">{feedback.title}</div>
              <div className="text-xs opacity-80">{feedback.msg}</div>
            </div>
            <button onClick={() => setFeedback(null)} className="ml-4 opacity-50 hover:opacity-100">
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar de Opções de Relatório */}
        <div className="w-full lg:w-72 space-y-3 shrink-0">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 px-4">Modelos de Relatório</div>
          {REPORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => !option.disabled && setActiveReport(option.id)}
              disabled={option.disabled}
              className={`w-full flex flex-col gap-1 px-5 py-4 rounded-2xl transition-all text-left group ${
                activeReport === option.id 
                  ? 'bg-[#ed0c00] text-white shadow-xl shadow-[#ed0c00]/20' 
                  : option.disabled 
                    ? 'opacity-40 cursor-not-allowed border border-white/5' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <option.icon size={18} />
                <span className="font-bold text-sm">{option.label}</span>
                {activeReport === option.id && <ChevronRight size={16} className="ml-auto" />}
              </div>
              <p className={`text-[10px] ${activeReport === option.id ? 'text-white/70' : 'text-gray-600'}`}>{option.desc}</p>
            </button>
          ))}
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 space-y-8">
          {/* Filtros */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ed0c00]/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-[#ed0c00]/10 text-[#ed0c00]">
                <Filter size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Parâmetros de Busca</h2>
                <p className="text-gray-500 text-xs">Refine sua busca para obter dados mais precisos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Período Inicial</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#ed0c00] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Período Final</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#ed0c00] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Atendente</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <select
                    value={atendenteId}
                    onChange={(e) => setAtendenteId(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#ed0c00] appearance-none transition-all"
                  >
                    <option value="">Todos os atendentes</option>
                    {atendentes.map((u) => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Status</label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#ed0c00] appearance-none transition-all"
                  >
                    <option value="">Todos os status</option>
                    <option value="ABERTO">Aberto</option>
                    <option value="ENCERRADO">Encerrado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Cliente Específico</label>
                <div 
                  onClick={() => setShowClientSearch(true)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs cursor-pointer hover:border-[#ed0c00]/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Building size={14} className="text-gray-600 group-hover:text-[#ed0c00]" />
                    <span className={selectedClient ? 'text-white font-bold' : 'text-gray-500'}>
                      {selectedClient ? selectedClient.name : 'Clique para selecionar um cliente...'}
                    </span>
                  </div>
                  {selectedClient && (
                    <XCircle 
                      size={16} 
                      className="text-gray-500 hover:text-[#ed0c00] transition-colors" 
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setSelectedClient(null);
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="md:col-span-2 flex gap-3 pt-6">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all border border-white/10 group"
                >
                  <Search size={18} className="text-gray-500 group-hover:text-white transition-colors" />
                  {loading ? 'Processando...' : 'Aplicar Filtros'}
                </button>
                <button
                  onClick={handleExport}
                  disabled={results.length === 0}
                  className="flex-1 bg-[#ed0c00] hover:bg-[#ff0d00] disabled:opacity-30 disabled:cursor-not-allowed text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#ed0c00]/20"
                >
                  <Download size={18} />
                  Exportar XLSX
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Resultados */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <FileText size={16} className="text-[#ed0c00]" />
                Registros Encontrados
              </h3>
              {results.length > 0 && (
                <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black text-white/50 border border-white/10 uppercase tracking-tighter">
                  {results.length} Itens
                </span>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/[0.02] text-gray-400">
                    <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px]">ID</th>
                    <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px]">Cliente</th>
                    <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px]">Atendente</th>
                    <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px]">Data Início</th>
                    <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px]">Tipo</th>
                    <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px]">Status</th>
                    <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px] text-right">Duração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td className="px-8 py-5"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-8 py-5"><Skeleton className="h-4 w-40" /></td>
                        <td className="px-8 py-5"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-8 py-5"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-8 py-5"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-8 py-5"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-8 py-5 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                      </tr>
                    ))
                  ) : results.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-gray-600">
                          <Search size={48} className="opacity-20" />
                          <p className="text-sm font-medium italic">
                            Nenhum registro encontrado para estes parâmetros.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    results.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5 font-mono text-gray-500 group-hover:text-gray-300">#{row.id.toString().padStart(5, '0')}</td>
                        <td className="px-8 py-5 font-bold text-gray-200 group-hover:text-[#ed0c00] transition-colors">{row.cliente}</td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-200 transition-colors">
                              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[9px] font-black">
                                {row.atendente?.substring(0, 2).toUpperCase()}
                              </div>
                              {row.atendente}
                           </div>
                        </td>
                        <td className="px-8 py-5 text-gray-500 font-medium">{row.data_inicio}</td>
                        <td className="px-8 py-5">
                          <span className="bg-white/5 px-2.5 py-1 rounded-lg text-[9px] font-black text-gray-400 group-hover:text-white transition-colors border border-white/5">
                            {row.tipo}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest ${
                            row.status === 'ABERTO' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                            row.status === 'ENCERRADO' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                            'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right font-mono font-bold text-gray-500 group-hover:text-white transition-colors">
                          <div className="flex items-center justify-end gap-3">
                            {row.tempo_decorrido ? `${row.tempo_decorrido} min` : '---'}
                            <button 
                              onClick={() => setSelectedAtendimentoId(row.id)}
                              className="p-1.5 rounded-lg bg-white/5 text-gray-500 hover:text-[#ed0c00] hover:bg-[#ed0c00]/10 transition-all"
                              title="Visualizar Detalhes"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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

      {selectedAtendimentoId && (
        <AtendimentoHistoryModal 
          atendimentoId={selectedAtendimentoId}
          onClose={() => setSelectedAtendimentoId(null)}
          canEdit={false}
        />
      )}
    </div>
  );
};

export default RelatoriosAtendimentos;
