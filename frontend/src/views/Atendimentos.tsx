import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Users,
  ChevronRight,
  User
} from 'lucide-react';
import { getAtendimentoStats, getAtendimentos } from '../services/api';
import ClientSearchModal from '../components/ClientSearchModal';
import NewAtendimentoForm from '../components/NewAtendimentoForm';
import ClientModal from '../components/ClientModal';

interface Props {
  onSelectAtendimento: (id: number) => void;
}

const Atendimentos: React.FC<Props> = ({ onSelectAtendimento }) => {
  const [stats, setStats] = useState<any>(null);
  const [allAtendimentos, setAllAtendimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showSearch, setShowSearch] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showRegisterClient, setShowRegisterClient] = useState(false);

  // Get current user ID
  const currentUser = useMemo(() => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, allRes] = await Promise.all([
        getAtendimentoStats(),
        getAtendimentos({ status: 'ABERTO' })
      ]);
      setStats(statsRes.data);
      setAllAtendimentos(allRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setShowSearch(false);
    setShowNewForm(true);
  };

  const handleNewSuccess = (id: number) => {
    setShowNewForm(false);
    setSelectedClient(null);
    loadDashboard();
    onSelectAtendimento(id);
  };

  // Filtered lists
  const myAtendimentos = useMemo(() => {
    if (!currentUser) return [];
    return allAtendimentos.filter(a => a.atendente_id === currentUser.id);
  }, [allAtendimentos, currentUser]);

  const otherAtendimentos = useMemo(() => {
    if (!currentUser) return allAtendimentos;
    const list = allAtendimentos.filter(a => a.atendente_id !== currentUser.id);
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(a => 
      a.cliente_nome.toLowerCase().includes(term) || 
      a.problema_inicial.toLowerCase().includes(term) ||
      a.atendente_nome.toLowerCase().includes(term) ||
      String(a.id).includes(term)
    );
  }, [allAtendimentos, currentUser, searchTerm]);

  const StatCard = ({ label, todayValue, monthValue, icon: Icon, color, isTime }: any) => (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-500`}>
          <Icon size={20} />
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xl font-bold text-white">
            {isTime ? `${Math.round(todayValue || 0)}m` : (todayValue || 0)}
          </div>
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Hoje</div>
        </div>
        <div className="border-l border-white/5 pl-4">
          <div className="text-xl font-bold text-white">
            {isTime ? `${Math.round(monthValue || 0)}m` : (monthValue || 0)}
          </div>
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">No Mês</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="text-white pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Atendimentos</h1>
          <p className="text-gray-500 text-sm">Controle de fluxos e chamados ativos.</p>
        </div>
        <button 
          onClick={() => setShowSearch(true)}
          className="bg-[#ed0c00] hover:bg-[#ff0d00] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#ed0c00]/20"
        >
          <Plus size={20} />
          Novo Atendimento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard 
          label="Totais" 
          todayValue={stats?.today?.total} 
          monthValue={stats?.month?.total} 
          icon={Users} 
          color="blue" 
        />
        <StatCard 
          label="Encerrados" 
          todayValue={stats?.today?.encerrado} 
          monthValue={stats?.month?.encerrado} 
          icon={CheckCircle} 
          color="green" 
        />
        <StatCard 
          label="Cancelados" 
          todayValue={stats?.today?.cancelado} 
          monthValue={stats?.month?.cancelado} 
          icon={XCircle} 
          color="red" 
        />
        <StatCard 
          label="Tempo Médio" 
          todayValue={stats?.today?.tempo_medio} 
          monthValue={stats?.month?.tempo_medio} 
          icon={Clock} 
          color="purple" 
          isTime 
        />
      </div>

      <div className="space-y-12">
        {/* SECTION: MEUS ATENDIMENTOS (Destaque) */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#ed0c00]/10 flex items-center justify-center text-[#ed0c00]">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Meus atendimentos</h2>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Atendimentos que você está conduzindo</p>
            </div>
            <div className="ml-auto bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-gray-400">
              {myAtendimentos.length} chamados
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAtendimentos.map(item => (
              <div 
                key={item.id}
                onClick={() => onSelectAtendimento(item.id)}
                className="bg-[#1a1a1a] border-2 border-[#ed0c00]/30 hover:border-[#ed0c00] rounded-3xl p-6 transition-all cursor-pointer group relative overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#ed0c00]/5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="text-[10px] font-bold text-gray-500 font-mono tracking-tighter">#{item.id.toString().padStart(5, '0')}</span>
                </div>

                <div className="mb-6 relative z-10">
                  <div className="text-lg font-black text-white group-hover:text-[#ed0c00] transition-colors mb-1 truncate">
                    {item.cliente_nome}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Clock size={12} className="text-[#ed0c00]" />
                    <span>Iniciado há {Math.round((new Date().getTime() - new Date(item.data_inicio).getTime()) / 60000)} min</span>
                  </div>
                </div>

                <div className="bg-black/40 rounded-2xl p-4 mb-6 relative z-10">
                  <div className="text-[10px] text-gray-500 uppercase font-black mb-2 flex items-center gap-1">
                    <MessageSquare size={10} /> Problema Relatado
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed italic">"{item.problema_inicial}"</p>
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-gray-400 font-bold uppercase">
                    {item.tipo_nome}
                  </span>
                </div>
              </div>
            ))}
            
            {myAtendimentos.length === 0 && !loading && (
              <div className="col-span-full bg-[#111111] border-2 border-dashed border-white/5 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Tudo em dia!</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">Você não possui nenhum atendimento em aberto atribuído ao seu usuário.</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION: TODOS ATENDIMENTOS (Compacto) */}
        <div>
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Users size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Atendimentos em aberto</h2>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Acompanhe o que os outros consultores estão fazendo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Pesquisar na fila..." 
                  className="bg-black border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 w-64 transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Consultor</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {otherAtendimentos.map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => onSelectAtendimento(item.id)}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono text-gray-500">#{item.id.toString().padStart(5, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-200 group-hover:text-blue-400 transition-colors">{item.cliente_nome}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{item.problema_inicial}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-500 border border-white/10">
                          {item.atendente_nome?.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-gray-400 font-medium">{item.atendente_nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-white/5 px-2 py-1 rounded text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                        {item.tipo_nome}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-blue-500/50 group-hover:text-blue-400 transition-all font-bold flex items-center gap-1">
                        Visualizar <ChevronRight size={14} />
                      </div>
                    </td>
                  </tr>
                ))}
                
                {otherAtendimentos.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                      Nenhum outro atendimento na fila correspondente à busca.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSearch && (
        <ClientSearchModal 
          onClose={() => setShowSearch(false)}
          onSelect={handleClientSelect}
          onRegisterNew={() => {
            setShowSearch(false);
            setShowRegisterClient(true);
          }}
        />
      )}

      {showNewForm && selectedClient && (
        <NewAtendimentoForm 
          client={selectedClient}
          onClose={() => {
            setShowNewForm(false);
            setSelectedClient(null);
          }}
          onBack={() => {
            setShowNewForm(false);
            setShowSearch(true);
          }}
          onSuccess={handleNewSuccess}
        />
      )}

      {showRegisterClient && (
        <ClientModal 
          groups={[]} 
          onClose={() => setShowRegisterClient(false)}
          onSave={() => {
            setShowRegisterClient(false);
            setShowSearch(true);
          }}
        />
      )}
    </div>
  );
};

export default Atendimentos;
