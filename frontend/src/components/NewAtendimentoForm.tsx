import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, Play, Building2, Hash } from 'lucide-react';
import { getAtendimentoConfigs, createAtendimento } from '../services/api';
import { formatCpfCnpj, onlyNumbers } from '../utils/formatters';

interface Props {
  client: any;
  onClose: () => void;
  onBack: () => void;
  onSuccess: (id: number) => void;
}

const NewAtendimentoForm: React.FC<Props> = ({ client, onClose, onBack, onSuccess }) => {
  const [configs, setConfigs] = useState<any>({
    origem: [],
    tipo: []
  });
  const [form, setForm] = useState({
    origem_id: '',
    tipo_id: '',
    problema_inicial: ''
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{title: string, msg: string, type: 'success' | 'danger'} | null>(null);

  useEffect(() => {
    const loadAllConfigs = async () => {
      try {
        const types = ['origem', 'tipo'];
        const results = await Promise.all(types.map(t => getAtendimentoConfigs(t)));
        const newConfigs: any = {};
        types.forEach((t, i) => {
          newConfigs[t] = results[i].data;
        });
        setConfigs(newConfigs);
      } catch (error) {
        console.error('Erro ao carregar configurações', error);
      }
    };
    loadAllConfigs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.origem_id || !form.tipo_id || !form.problema_inicial) {
      setFeedback({ title: 'Campos Obrigatórios', msg: 'Preencha Origem, Tipo e Problema Inicial', type: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const response = await createAtendimento({
        cliente_id: client.id,
        ...form
      });
      onSuccess(response.data.id);
    } catch (error) {
      setFeedback({ title: 'Erro', msg: 'Erro ao iniciar atendimento', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Novo Atendimento</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {feedback && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in zoom-in duration-200 ${
              feedback.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'
            }`}>
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider">{feedback.title}</div>
                <div className="text-xs opacity-80">{feedback.msg}</div>
              </div>
              <button type="button" onClick={() => setFeedback(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Client Info Summary */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-8 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-[#ed0c00]" />
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Cliente</div>
                <div className="text-sm font-bold text-white">{client.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hash size={18} className="text-[#ed0c00]" />
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  {onlyNumbers(client.cnpj || '').length <= 11 ? 'CPF' : 'CNPJ'}
                </div>
                <div className="text-sm font-bold text-white">{formatCpfCnpj(client.cnpj || '') || '---'}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Origem *</label>
              <select
                required
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ed0c00] transition-colors appearance-none"
                value={form.origem_id}
                onChange={e => setForm({...form, origem_id: e.target.value})}
              >
                <option value="" className="bg-[#111111]">Selecione...</option>
                {configs.origem.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.nome}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo *</label>
              <select
                required
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ed0c00] transition-colors appearance-none"
                value={form.tipo_id}
                onChange={e => setForm({...form, tipo_id: e.target.value})}
              >
                <option value="" className="bg-[#111111]">Selecione...</option>
                {configs.tipo.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 mb-8">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Problema Inicial *</label>
            <textarea
              required
              rows={4}
              placeholder="Descreva o problema relatado pelo cliente..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ed0c00] transition-colors resize-none"
              value={form.problema_inicial}
              onChange={e => setForm({...form, problema_inicial: e.target.value})}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/10"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-[#ed0c00] hover:bg-[#ff0d00] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-[#ed0c00]/20 flex items-center justify-center gap-2"
            >
              <Play size={18} fill="currentColor" />
              {loading ? 'Iniciando...' : 'Iniciar Atendimento'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default NewAtendimentoForm;
