import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building2, 
  Hash,
  Send,
  History
} from 'lucide-react';
import { 
  getAtendimentoById, 
  getAtendimentoHistory, 
  addAtendimentoHistory, 
  updateAtendimento, 
  endAtendimento, 
  cancelAtendimento,
  getAtendimentoConfigs,
  getAtendimentos
} from '../services/api';

interface Props {
  atendimentoId: number;
  onBack: () => void;
}

const AtendimentoDetail: React.FC<Props> = ({ atendimentoId, onBack }) => {
  const [atendimento, setAtendimento] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [recentAtendimentos, setRecentAtendimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newResponse, setNewResponse] = useState('');
  const [configs, setConfigs] = useState<any>({
    origem: [],
    tipo: [],
    categoria: [],
    aplicacao: [],
    modulo: []
  });
  const [form, setForm] = useState<any>(null);

  const currentUser = React.useMemo(() => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }, []);

  const isOwner = atendimento?.atendente_id === currentUser?.id;
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';
  const canEdit = (isOwner || isAdmin) && atendimento?.status === 'ABERTO';

  const loadData = async () => {
    setLoading(true);
    try {
      const [atendRes, histRes, configResults] = await Promise.all([
        getAtendimentoById(atendimentoId),
        getAtendimentoHistory(atendimentoId),
        Promise.all(['origem', 'tipo', 'categoria', 'aplicacao', 'modulo'].map(t => getAtendimentoConfigs(t)))
      ]);

      setAtendimento(atendRes.data);
      setForm(atendRes.data);
      setHistory(histRes.data);

      const types = ['origem', 'tipo', 'categoria', 'aplicacao', 'modulo'];
      const newConfigs: any = {};
      types.forEach((t, i) => {
        newConfigs[t] = configResults[i].data;
      });
      setConfigs(newConfigs);

      // Load recent atendimentos for this client
      const recentRes = await getAtendimentos({ cliente_id: atendRes.data.cliente_id });
      setRecentAtendimentos(recentRes.data.filter((a: any) => a.id !== atendimentoId).slice(0, 5));

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [atendimentoId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (atendimento?.status !== 'ABERTO') return;
      
      if (e.key === 'F6') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'F11') {
        e.preventDefault();
        handleEnd();
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [atendimento, form]);

  const handleSave = async () => {
    try {
      await updateAtendimento(atendimentoId, form);
      alert('Atendimento atualizado!');
      loadData();
    } catch (error) {
      alert('Erro ao salvar');
    }
  };

  const handleEnd = async () => {
    if (!confirm('Deseja encerrar este atendimento?')) return;
    try {
      await endAtendimento(atendimentoId);
      onBack();
    } catch (error) {
      alert('Erro ao encerrar');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Deseja cancelar este atendimento?')) return;
    try {
      await cancelAtendimento(atendimentoId);
      onBack();
    } catch (error) {
      alert('Erro ao cancelar');
    }
  };

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResponse.trim()) return;
    try {
      await addAtendimentoHistory(atendimentoId, newResponse);
      setNewResponse('');
      const histRes = await getAtendimentoHistory(atendimentoId);
      setHistory(histRes.data);
    } catch (error) {
      alert('Erro ao adicionar resposta');
    }
  };

  if (loading || !atendimento) return <div className="text-white p-8">Carregando...</div>;

  return (
    <div className="text-white pb-12">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">Atendimento #{atendimento.id.toString().padStart(5, '0')}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                atendimento.status === 'ABERTO' ? 'bg-yellow-500/10 text-yellow-500' :
                atendimento.status === 'ENCERRADO' ? 'bg-green-500/10 text-green-500' :
                'bg-red-500/10 text-red-500'
              }`}>
                {atendimento.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm">Gerencie os detalhes e o histórico deste atendimento.</p>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-3">
            <button onClick={handleCancel} className="bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-gray-400 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/10 flex items-center gap-2">
              <XCircle size={16} />
              Cancelar
            </button>
            <button onClick={handleEnd} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
              <CheckCircle size={16} />
              Encerrar (F11)
            </button>
            <button onClick={handleSave} className="bg-[#ed0c00] hover:bg-[#ff0d00] text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#ed0c00]/20 flex items-center gap-2">
              <Save size={16} />
              Salvar (F6)
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details and History Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Client & Info Card */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Cliente</div>
                    <div className="text-base font-bold">{atendimento.cliente_nome}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Atendente</div>
                    <div className="text-base font-bold">{atendimento.atendente_nome}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Data Início</div>
                    <div className="text-base font-bold">{new Date(atendimento.data_inicio).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                    <Hash size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">CNPJ</div>
                    <div className="text-base font-bold">{atendimento.cnpj || '---'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 pt-8 border-t border-white/5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Origem</label>
                <select
                  disabled={!canEdit}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ed0c00] transition-colors appearance-none disabled:opacity-50"
                  value={form.origem_id}
                  onChange={e => setForm({...form, origem_id: e.target.value})}
                >
                  {configs.origem.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tipo</label>
                <select
                  disabled={!canEdit}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ed0c00] transition-colors appearance-none disabled:opacity-50"
                  value={form.tipo_id}
                  onChange={e => setForm({...form, tipo_id: e.target.value})}
                >
                  {configs.tipo.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Categoria</label>
                <select
                  disabled={!canEdit}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ed0c00] transition-colors appearance-none disabled:opacity-50"
                  value={form.categoria_id || ''}
                  onChange={e => setForm({...form, categoria_id: e.target.value})}
                >
                  <option value="" className="bg-[#111111]">Nenhuma</option>
                  {configs.categoria.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Aplicação</label>
                <select
                  disabled={!canEdit}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ed0c00] transition-colors appearance-none disabled:opacity-50"
                  value={form.aplicacao_id || ''}
                  onChange={e => setForm({...form, aplicacao_id: e.target.value})}
                >
                  <option value="" className="bg-[#111111]">Nenhuma</option>
                  {configs.aplicacao.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Módulo</label>
                <select
                  disabled={!canEdit}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ed0c00] transition-colors appearance-none disabled:opacity-50"
                  value={form.modulo_id || ''}
                  onChange={e => setForm({...form, modulo_id: e.target.value})}
                >
                  <option value="" className="bg-[#111111]">Nenhum</option>
                  {configs.modulo.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.nome}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-8 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Problema Inicial</label>
              <textarea
                disabled={!canEdit}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ed0c00] transition-colors resize-none disabled:opacity-50"
                value={form.problema_inicial}
                onChange={e => setForm({...form, problema_inicial: e.target.value})}
              />
            </div>
          </div>

          {/* History Feed */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 px-2">
              <History size={20} className="text-[#ed0c00]" />
              Histórico de Respostas
            </h2>
            
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={item.id} className="bg-[#111111] border border-white/10 rounded-2xl p-5 relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400 border border-white/10">
                        {item.atendente_nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{item.atendente_nome}</div>
                        <div className="text-[10px] text-gray-500">{new Date(item.data_registro).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-700 font-mono">#{index + 1}</div>
                  </div>
                  <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {item.descricao}
                  </div>
                </div>
              ))}

              {canEdit && (
                <div className="bg-[#111111] border border-[#ed0c00]/20 rounded-2xl p-6 shadow-lg shadow-[#ed0c00]/5">
                  <form onSubmit={handleAddHistory}>
                    <textarea
                      rows={4}
                      placeholder="Digite sua resposta ou solução aqui..."
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ed0c00] transition-colors resize-none mb-4"
                      value={newResponse}
                      onChange={e => setNewResponse(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        className="bg-[#ed0c00] hover:bg-[#ff0d00] text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#ed0c00]/20 flex items-center gap-2"
                      >
                        <Send size={16} />
                        Enviar Resposta
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar info */}
        <div className="space-y-8">
          {/* Recent Atendimentos for this client */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 px-2">Últimos Atendimentos</h2>
            <div className="space-y-3">
              {recentAtendimentos.map(item => (
                <div key={item.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 hover:border-white/20 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] text-gray-500 font-mono">#{item.id.toString().padStart(5, '0')}</div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      item.status === 'ENCERRADO' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold mb-1 group-hover:text-[#ed0c00] transition-colors">{item.tipo_nome}</div>
                  <div className="text-[10px] text-gray-500 truncate mb-2">{item.problema_inicial}</div>
                  <div className="text-[9px] text-gray-600">{new Date(item.data_inicio).toLocaleDateString()}</div>
                </div>
              ))}
              {recentAtendimentos.length === 0 && (
                <p className="text-gray-600 text-xs italic text-center py-4">Nenhum atendimento anterior.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtendimentoDetail;
