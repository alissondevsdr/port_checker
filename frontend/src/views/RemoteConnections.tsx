import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2,
  AlertCircle, Monitor,
} from 'lucide-react';
import { getRemoteConnections, deleteRemoteConnection } from '../services/api';
import RemoteConnectionModal from '../components/RemoteConnectionModal';

// ── RemoteConnectionCard ──────────────────────────────────────────────────────

const RemoteConnectionCard = ({
  connection,
  onEdit,
  onDelete,
}: {
  connection: any;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [confirmDel, setConfirmDel] = useState(false);

  const getTypeColor = (type: string) => {
    if (type === 'AnyDesk') return { bg: 'rgba(59, 130, 246, .1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, .15)' };
    if (type === 'Rustdesk') return { bg: 'rgba(168, 85, 247, .1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, .15)' };
    return { bg: 'rgba(107, 114, 128, .1)', color: '#6b7280', border: '1px solid rgba(107, 114, 128, .15)' };
  };

  const typeStyle = getTypeColor(connection.connection_type);

  return (
    <div
      className="px-5 py-4 transition-colors"
      style={{
        borderBottom: '1px solid #333333',
        background: 'transparent',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.015)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-2 flex-shrink-0">
          <Monitor size={16} style={{ color: '#ed0c00' }} />
        </div>

        {/* Info block */}
        <div className="flex-1 min-w-0">
          {/* Row 1: name + type */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-white">{connection.company_name}</span>
            <span
              className="text-xs px-2 py-0.5 rounded font-semibold"
              style={typeStyle}
            >
              {connection.connection_type}
            </span>
          </div>

          {/* Row 2: connection info */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 font-mono text-xs" style={{ color: '#cccccc' }}>
              {connection.connection_string}
            </span>
          </div>

          {/* Row 3: created date */}
          <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs" style={{ color: '#aaaaaa' }}>
            <span>
              {connection.created_at && new Date(connection.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {confirmDel ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)' }}>
              <span style={{ color: '#ed0c00' }}>Excluir?</span>
              <button onClick={onDelete} className="font-bold underline" style={{ color: '#ed0c00' }}>Sim</button>
              <button onClick={() => setConfirmDel(false)} style={{ color: '#cccccc' }}>Não</button>
            </div>
          ) : (
            <>
              <button onClick={onEdit} className="btn btn-ghost" style={{ padding: '6px 10px' }} title="Editar">
                <Edit2 size={13} />
              </button>
              <button onClick={() => setConfirmDel(true)} className="btn btn-danger" style={{ padding: '6px 10px' }} title="Excluir">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── RemoteConnections (main view) ──────────────────────────────────────────────

const RemoteConnections: React.FC = () => {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editConnection, setEdit] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const res = await getRemoteConnections();
      setConnections(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    try {
      await deleteRemoteConnection(id);
      await load();
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
    }
  };

  const filtered = [...connections]
    .filter(c => {
      const q = search.toLowerCase();
      return !q || c.company_name.toLowerCase().includes(q) || c.connection_string.toLowerCase().includes(q) || c.connection_type.toLowerCase().includes(q);
    });

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Conexões Remotas</h2>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            {connections.length} cadastradas
          </p>
        </div>
        <button
          onClick={() => { setEdit(null); setModal(true); }}
          className="btn btn-primary"
        >
          <Plus size={14} /> Nova Conexão
        </button>
      </div>

      {/* Search bar */}
      <div className="card overflow-hidden mb-0" style={{ borderRadius: '12px 12px 0 0', borderBottom: 'none' }}>
        <div className="px-4 py-3 flex flex-col" style={{ borderBottom: '1px solid #1a1a2a' }}>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
            <input
              className="field !pl-9 text-sm w-full"
              placeholder="Buscar por empresa, conexão ou tipo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Connection list */}
      <div className="card overflow-hidden" style={{ borderRadius: '0 0 12px 12px' }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 animate-pulse" style={{ borderBottom: '1px solid #1a1a2a' }}>
              <div className="flex gap-3 items-start">
                <div className="dot bg-slate-800 mt-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded bg-slate-800 w-52" />
                  <div className="h-3 rounded bg-slate-800 w-80" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle size={32} style={{ color: '#1e293b', margin: '0 auto 12px' }} />
            <p className="text-sm" style={{ color: '#475569' }}>
              {connections.length === 0 ? 'Nenhuma conexão remota cadastrada.' : 'Nenhum resultado para a pesquisa.'}
            </p>
          </div>
        ) : (
          filtered.map(c => (
            <RemoteConnectionCard
              key={c.id}
              connection={c}
              onEdit={() => { setEdit(c); setModal(true); }}
              onDelete={() => handleDelete(c.id)}
            />
          ))
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-2.5 text-xs" style={{ color: '#334155', borderTop: '1px solid #1a1a2a' }}>
            {filtered.length} de {connections.length} conexões
          </div>
        )}
      </div>

      {modal && (
        <RemoteConnectionModal
          connection={editConnection}
          onClose={() => { setModal(false); setEdit(null); }}
          onSave={() => { setModal(false); setEdit(null); load(); }}
        />
      )}
    </div>
  );
};

export default RemoteConnections;
