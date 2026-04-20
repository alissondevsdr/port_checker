import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, FolderTree, Trash2, Users, Zap, RefreshCw,
  ChevronRight, ChevronUp, ChevronDown, ArrowLeft, Phone, Wifi, Globe,
  XCircle, X, Clock, Edit2,
} from 'lucide-react';
import {
  getGroups, createGroup, deleteGroup,
  getClients, testGroup, testClient, deleteClient,
} from '../services/api';
import ClientModal from '../components/ClientModal';

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusDot = (s: string) => {
  if (s === 'OK')      return 'dot dot-ok';
  if (s === 'ERROR')   return 'dot dot-error';
  return 'dot dot-pending';
};

const statusChip = (s: string) => {
  if (s === 'OK')      return 'chip chip-ok';
  if (s === 'ERROR')   return 'chip chip-error';
  return 'chip chip-pending';
};

// ── GroupCard ─────────────────────────────────────────────────────────────────

const GroupCard = ({
  group,
  onSelect,
  onDelete,
}: {
  group: any;
  onSelect: () => void;
  onDelete: () => void;
}) => {
  const ok      = group.ok_count || 0;
  const err     = group.error_count || 0;
  const total   = group.client_count || 0;
  const pending = total - ok - err;

  return (
    <div
      className="card p-5 cursor-pointer transition-all fade-up"
      style={{ borderColor: err > 0 ? 'rgba(239,68,68,.25)' : '#333333' }}
      onClick={onSelect}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ed0c0055'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = err > 0 ? 'rgba(239,68,68,.25)' : '#333333'; }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#333333', border: '1px solid #ed0c0044' }}>
            <FolderTree size={16} style={{ color: '#ed0c00' }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-white truncate">{group.name}</h3>
            <p className="text-xs mt-0.5" style={{ color: '#aaaaaa' }}>
              {total} cliente{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
            style={{ color: '#aaaaaa' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ed0c00'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#aaaaaa'; }}
            title="Excluir grupo"
          >
            <Trash2 size={13} />
          </button>
          <ChevronRight size={16} style={{ color: '#aaaaaa' }} />
        </div>
      </div>

      {total > 0 && (
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {ok > 0 &&      <span className="chip chip-ok">✓ {ok} ok</span>}
          {err > 0 &&     <span className="chip chip-error">✗ {err} erro{err > 1 ? 's' : ''}</span>}
          {pending > 0 &&  <span className="chip chip-pending">· {pending} pendente</span>}
        </div>
      )}
    </div>
  );
};

// ── ClientRow ─────────────────────────────────────────────────────────────────

const ClientRow = ({
  client,
  onTest,
  onEdit,
  onDelete,
  testing,
}: {
  client: any;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
  testing: boolean;
}) => {
  const [confirmDel, setConfirmDel] = useState(false);

  const portChips = (client.ports || []).map((port: number, i: number) => {
    // Try to find per-port result from last test details
    let portState: 'unknown' | 'ok' | 'error' = 'unknown';
    if (client._portResults) {
      const r = client._portResults.find((p: any) => p.port === port);
      if (r) portState = r.is_open ? 'ok' : 'error';
    } else if (client.status === 'OK') {
      portState = 'ok';
    } else if (client.status === 'ERROR') {
      portState = 'error';
    }

    return (
      <span
        key={i}
        className={portState === 'ok' ? 'chip-port-ok' : portState === 'error' ? 'chip-port-error' : 'font-mono text-xs px-2 py-0.5 rounded'}
        style={portState === 'unknown' ? { background: 'rgba(71,85,105,.1)', color: '#cccccc', border: '1px solid rgba(71,85,105,.15)' } : {}}
      >
        :{port}
        {portState === 'ok' && ' ✓'}
        {portState === 'error' && ' ✗'}
      </span>
    );
  });

  return (
    <div className="fade-up" style={{ borderBottom: '1px solid #333333' }}>
      <div className="px-5 py-4 hover:bg-white/[0.015] transition-colors">

        {/* Top row: status + name + actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`${statusDot(client.status)} mt-1.5`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-white">{client.name}</span>
                <span className={statusChip(client.status)}>{client.status}</span>
                {client.cnpj && (
                  <span className="font-mono text-xs" style={{ color: '#aaaaaa' }}>
                    {client.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                  </span>
                )}
              </div>

              {/* Host + ports */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 font-mono text-xs" style={{ color: '#cccccc' }}>
                  <Globe size={11} /> {client.host}
                </span>
                {portChips.length > 0 && (
                  <span className="text-xs" style={{ color: '#888888' }}>|</span>
                )}
                <div className="flex gap-1 flex-wrap">{portChips}</div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs" style={{ color: '#aaaaaa' }}>
                {client.provedor_internet && (
                  <span className="flex items-center gap-1">
                    <Wifi size={10} /> {client.provedor_internet}
                  </span>
                )}
                {client.phone && (
                  <a
                    href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 transition-colors"
                    style={{ color: '#aaaaaa' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#22c55e'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#aaaaaa'; }}
                    title="Abrir no WhatsApp"
                  >
                    <Phone size={10} />
                    {client.phone}
                  </a>
                )}
                {client.last_test && (
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(client.last_test).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                )}
                {client.avg_response_ms && (
                  <span className="font-mono" style={{ color: '#ed0c00' }}>
                    {Math.round(client.avg_response_ms)}ms
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {confirmDel ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)' }}>
                <span style={{ color: '#f87171' }}>Excluir?</span>
                <button onClick={onDelete} className="font-bold underline" style={{ color: '#f87171' }}>Sim</button>
                <button onClick={() => setConfirmDel(false)} style={{ color: '#64748b' }}>Não</button>
              </div>
            ) : (
              <>
                <button
                  onClick={onTest}
                  disabled={testing}
                  className="btn btn-ghost"
                  style={{ padding: '6px 10px' }}
                  title="Testar"
                >
                  {testing ? <RefreshCw size={13} className="spin" /> : <Zap size={13} />}
                </button>
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
    </div>
  );
};

// ── GroupDetail ───────────────────────────────────────────────────────────────

const GroupDetail = ({
  group,
  onBack,
  onEdit,
}: {
  group: any;
  onBack: () => void;
  onEdit: (client: any) => void;
}) => {
  const [clients, setClients]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [testing, setTesting]     = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [sortKey, setSortKey]     = useState<'name' | 'status' | 'last_test'>('name');
  const [sortAsc, setSortAsc]     = useState(true);
  const [showCritical, setShowCritical] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getClients(group.id);
      setClients(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  const handleTestAll = async () => {
    setTesting(true);
    try { await testGroup(group.id); await load(); }
    catch (e) { console.error(e); }
    finally { setTesting(false); }
  };

  const handleTestOne = async (id: number) => {
    setTestingId(id);
    try { await testClient(id); await load(); }
    catch (e) { console.error(e); }
    finally { setTestingId(null); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteClient(id); await load(); }
    catch (e) { console.error(e); }
  };

  const ok      = clients.filter(c => c.status === 'OK').length;
  const err     = clients.filter(c => c.status === 'ERROR').length;
  const pending = clients.length - ok - err;

  // For closed port highlight
  const critical = clients.filter(c => c.status === 'ERROR');

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="btn btn-ghost" style={{ padding: '7px 10px' }}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">{group.name}</h2>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
              {clients.length} cliente{clients.length !== 1 ? 's' : ''}
              {ok > 0 && ' • '}
              {ok > 0 && <span style={{ color: '#22c55e' }}>{ok} OK</span>}
              {err > 0 && ok > 0 && ' · '}
              {err > 0 && <span style={{ color: '#ef4444' }}>{err} erro{err > 1 ? 's' : ''}</span>}
              {pending > 0 && (ok > 0 || err > 0) && ' · '}
              {pending > 0 && <span style={{ color: '#64748b' }}>{pending} pendente</span>}
            </p>
          </div>
        </div>
        <button
          onClick={handleTestAll}
          disabled={testing || clients.length === 0}
          className="btn btn-success"
        >
          {testing ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
          {testing ? 'Testando...' : 'Testar Grupo'}
        </button>
      </div>

      {/* Alert for critical clients */}
      {critical.length > 0 && (
        <div className="mb-5 rounded-lg fade-up" style={{ background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)' }}>
          <button
            type="button"
            onClick={() => setShowCritical(true)}
            className="w-full text-left px-4 py-4 flex items-center justify-between gap-3"
            style={{ color: '#f87171' }}
          >
            <span className="flex items-center gap-2">
              <XCircle size={14} style={{ color: '#ef4444' }} />
              <span className="text-xs font-bold uppercase tracking-widest">
                {critical.length} cliente{critical.length > 1 ? 's' : ''} com portas fechadas — requer contato
              </span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#ed0c00' }}>
              Ver clientes
            </span>
          </button>
        </div>
      )}

      {showCritical && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative mx-auto w-full max-w-3xl max-h-[calc(100vh-4rem)] rounded-2xl border border-[#333333] bg-[#111111] shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#333333]">
              <div>
                <h3 className="text-lg font-bold text-white">Clientes com erro</h3>
                <p className="text-xs mt-1" style={{ color: '#aaaaaa' }}>
                  {critical.length} cliente{critical.length > 1 ? 's' : ''} com portas fechadas no grupo {group.name}
                </p>
              </div>
              <button type="button" onClick={() => setShowCritical(false)} className="btn btn-ghost">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-6 space-y-3">
              {critical.map(c => (
                <div key={c.id} className="rounded-xl border border-[#333333] bg-[#121212] p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{c.name}</span>
                    {c.status === 'ERROR' && (
                      <span className="text-xs uppercase tracking-widest" style={{ color: '#ed0c00' }}>Erro</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: '#aaaaaa' }}>
                    {c.phone && <span>📞 {c.phone}</span>}
                    {c.provedor_internet && <span>🌐 {c.provedor_internet}</span>}
                    {c.host && <span>🖧 {c.host}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sort bar */}
      <div
        className="px-5 py-2 flex items-center gap-6 text-xs font-semibold uppercase tracking-widest select-none"
        style={{ background: 'rgba(0,0,0,.2)', borderBottom: '1px solid #333333', color: '#aaaaaa' }}
      >
        {([
          ['name', 'Cliente'],
          ['status', 'Status'],
          ['last_test', 'Último Teste'],
        ] as ['name' | 'status' | 'last_test', string][]).map(([k, label]) => (
          <button
            key={k}
            className="flex items-center gap-1 cursor-pointer transition-colors"
            style={{ color: sortKey === k ? '#ffffff' : '#aaaaaa' }}
            onClick={() => {
              setSortKey(k);
              setSortAsc(sortKey === k ? !sortAsc : true);
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = sortKey === k ? '#ffffff' : '#aaaaaa'; }}
          >
            {label}
            {sortKey === k && (sortAsc ? <ChevronUp size={11} style={{ color: '#ed0c00' }} /> : <ChevronDown size={11} style={{ color: '#ed0c00' }} />)}
          </button>
        ))}
      </div>

      {/* Client list */}
      <div className="card overflow-hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4 animate-pulse" style={{ borderBottom: '1px solid #1a1a2a' }}>
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full mt-1.5 bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-48" />
                  <div className="h-3 bg-slate-800 rounded w-72" />
                  <div className="h-3 bg-slate-800 rounded w-56" />
                </div>
              </div>
            </div>
          ))
        ) : clients.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} style={{ color: '#1e293b', margin: '0 auto 12px' }} />
            <p className="text-sm" style={{ color: '#475569' }}>Nenhum cliente neste grupo.</p>
            <p className="text-xs mt-1" style={{ color: '#334155' }}>
              Adicione clientes em <strong>Clientes</strong> e atribua a este grupo.
            </p>
          </div>
        ) : (
          (() => {
            const sortedClients = [...clients].sort((a, b) => {
              let va = a[sortKey], vb = b[sortKey];
              if (sortKey === 'last_test') {
                va = va ? new Date(va).getTime() : 0;
                vb = vb ? new Date(vb).getTime() : 0;
              } else if (typeof va === 'string') va = va.toLowerCase();
              if (typeof vb === 'string') vb = vb.toLowerCase();
              return sortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
            });
            return sortedClients.map(c => (
              <ClientRow
                key={c.id}
                client={c}
                testing={testingId === c.id}
                onTest={() => handleTestOne(c.id)}
                onEdit={() => onEdit(c)}
                onDelete={() => handleDelete(c.id)}
              />
            ));
          })()
        )}
      </div>
    </div>
  );
};

// ── Groups (main view) ────────────────────────────────────────────────────────

const Groups: React.FC = () => {
  const [groups, setGroups]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [newName, setNewName]       = useState('');
  const [creating, setCreating]     = useState(false);
  const [selected, setSelected]     = useState<any>(null);
  const [editClient, setEditClient] = useState<any>(null);
  const [showForm, setShowForm]     = useState(false);
  const [search, setSearch]         = useState('');

  const loadGroups = useCallback(async (refreshSelected = true) => {
    try {
      const { data } = await getGroups();
      setGroups(data);
      // Refresh selected group data only when requested
      if (refreshSelected && selected) {
        const updated = data.find((g: any) => g.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selected]);

  useEffect(() => { loadGroups(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try { await createGroup(newName.trim()); setNewName(''); await loadGroups(); }
    catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir grupo? Os clientes não serão removidos.')) return;
    try { await deleteGroup(id); await loadGroups(); }
    catch (e) { console.error(e); }
  };

  // Drill-down into group
  if (selected) {
    return (
      <>
        <GroupDetail
          group={selected}
          onBack={() => { setSelected(null); loadGroups(false); }}
          onEdit={(c) => setEditClient(c)}
        />
        {editClient && (
          <ClientModal
            client={editClient}
            groups={groups}
            onClose={() => setEditClient(null)}
            onSave={() => { setEditClient(null); loadGroups(); }}
          />
        )}
      </>
    );
  }

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Grupos</h2>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            Selecione um grupo para testar e verificar o status das portas
          </p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="btn btn-primary"
        >
          <Plus size={14} /> Novo Grupo
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-5 mb-5 fade-up">
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              className="field flex-1"
              placeholder="Nome do grupo (ex: Filiais SP)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
              maxLength={80}
            />
            <button type="submit" disabled={creating || !newName.trim()} className="btn btn-success flex-shrink-0">
              {creating ? <RefreshCw size={13} className="spin" /> : <Plus size={13} />}
              Criar
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost flex-shrink-0">Cancelar</button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-5 fade-up">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              className="field !pl-9 text-sm"
              placeholder="Buscar por nome do grupo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <FolderTree size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#aaaaaa' }} />
          </div>
        </div>
      </div>

      {/* Groups grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-32" />
                  <div className="h-3 bg-slate-800 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card py-16 text-center">
          <FolderTree size={36} style={{ color: '#1e293b', margin: '0 auto 12px' }} />
          <p className="text-sm" style={{ color: '#475569' }}>Nenhum grupo cadastrado.</p>
          <p className="text-xs mt-1" style={{ color: '#334155' }}>Crie um grupo para organizar seus clientes por região, segmento etc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 group">
          {groups
            .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
            .map(g => (
              <GroupCard
                key={g.id}
                group={g}
                onSelect={() => setSelected(g)}
                onDelete={() => handleDelete(g.id)}
              />
            ))}
        </div>
      )}
    </div>
  );
};


export default Groups;
