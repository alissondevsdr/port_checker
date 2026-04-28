import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, UserPlus, ArrowRight } from 'lucide-react';
import { getClients } from '../services/api';

interface Props {
  onClose: () => void;
  onSelect: (client: any) => void;
  onRegisterNew: () => void;
}

const ClientSearchModal: React.FC<Props> = ({ onClose, onSelect, onRegisterNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchClients();
      } else {
        setClients([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchClients = async () => {
    setLoading(true);
    try {
      const response = await getClients();
      // Filter manually for now as the API might not support name search yet
      const filtered = response.data.filter((c: any) => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.cnpj.includes(searchTerm)
      );
      setClients(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Buscar Cliente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              autoFocus
              type="text"
              placeholder="Digite o nome ou CNPJ do cliente..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#ed0c00] transition-colors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {clients.map(client => (
              <button
                key={client.id}
                onClick={() => onSelect(client)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
              >
                <div className="text-left">
                  <div className="text-sm font-bold text-white group-hover:text-[#ed0c00] transition-colors">{client.name}</div>
                  <div className="text-xs text-gray-500">{client.cnpj || 'Sem CNPJ'}</div>
                </div>
                <ArrowRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
              </button>
            ))}

            {searchTerm.length >= 2 && clients.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-4">Nenhum cliente encontrado.</p>
                <button 
                  onClick={onRegisterNew}
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm transition-colors border border-white/10"
                >
                  <UserPlus size={16} />
                  Cadastrar Novo Cliente
                </button>
              </div>
            )}

            {searchTerm.length < 2 && (
              <div className="text-center py-8 text-gray-500 text-sm italic">
                Comece a digitar para buscar...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ClientSearchModal;
