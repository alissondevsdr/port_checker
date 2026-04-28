import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, FolderTree, Trash2, Users, Zap, RefreshCw,
  ChevronRight, ChevronUp, ChevronDown, ArrowLeft,
  XCircle, X, Clock, Edit2,
} from 'lucide-react';
import {
  getGroups, createGroup, deleteGroup,
  getClients, testClient, deleteClient,
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

type BatchProgress = {
  total: number;
  completed: number;
  currentName: string;
  finished: boolean;
  etaSeconds: number;
} | null;

const STATUS_RANK: Record<string, number> = {
  OK: 0,
  ERROR: 1,
  PENDING: 2,
};

const normalizeTestResult = (result: any) => ({
  status: result.status || 'PENDING',
  last_test: result.last_test || null,
  avg_response_ms: result.avg_response_ms ?? null,
  _portResults: (result.results || []).map((r: any) => ({
    port: r.port,
    is_open: Boolean(r.open),
    response_ms: r.response_time ?? null,
    error: r.error ?? null,
  })),
});

const BatchProgressBar = ({ progress }: { progress: BatchProgress }) => {
  if (!progress) return null;
  const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  return (
    <div className="card p-4 mb-4 fade-up" style={{ borderColor: progress.finished ? 'rgba(34,197,94,.25)' : '#333333' }}>
      <div className="flex items-center justify-between gap-3 text-xs" style={{ color: '#94a3b8' }}>
        <span>{progress.completed} de {progress.total} clientes</span>
        <span className="font-mono">{percent}%</span>
      </div>
      <div className="w-full h-2 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,.08)' }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${percent}%`, background: progress.finished ? '#22c55e' : '#f59e0b' }}
        />
      </div>
      <p className="text-xs mt-2" style={{ color: progress.finished ? '#22c55e' : '#fbbf24' }}>
        {progress.finished ? 'Testes concluídos' : `Testando ${progress.currentName}...`}
      </p>
      {!progress.finished && (
        <p className="text-[11px] mt-1" style={{ color: '#64748b' }}>
          Tempo estimado restante: ~{progress.etaSeconds}s
        </p>
      )}
    </div>
  );
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
  const isTesting = testing;
  const portResults = client._portResults || [];
  const ports = client.ports || [];

  const getPortState = (port: number): 'ok' | 'error' | 'pending' => {
    const result = portResults.find((p: any) => p.port === port);
    if (result) return result.is_open ? 'ok' : 'error';
    if (client.status === 'OK') return 'ok';
    if (client.status === 'ERROR') return 'error';
    return 'pending';
  };

  return (
    <div className="fade-up" style={{ borderBottom: '1px solid #333333' }}>
      <div
        className="px-5 py-4 transition-all duration-300"
        style={{
          background: isTesting ? 'rgba(245,158,11,.07)' : 'transparent',
          borderLeft: client.status === 'ERROR' && !isTesting ? '2px solid rgba(239,68,68,.45)' : '2px solid transparent',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`${isTesting ? 'dot dot-pending' : statusDot(client.status)} mt-1.5`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-white">{client.name}</span>
                <span className={isTesting ? 'chip chip-pending' : statusChip(client.status)}>
                  {isTesting ? 'Testando...' : client.status === 'ERROR' ? 'Fechada' : client.status === 'OK' ? 'Aberta' : 'Pendente'}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs" style={{ color: '#94a3b8' }}>
                <Clock size={10} />
                {client.last_test
                  ? new Date(client.last_test).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                  : 'Nunca testado'}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {ports.length === 0 && (
                  <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: 'rgba(71,85,105,.1)', color: '#94a3b8' }}>
                    Sem porta
                  </span>
                )}
                {ports.map((port: number) => {
                  const state = getPortState(port);
                  const label =
                    state === 'ok' ? '🟢 Aberta' : state === 'error' ? '🔴 Fechada' : '🟡 Testando...';
                  return (
                    <span
                      key={port}
                      className="font-mono text-xs px-2 py-1 rounded transition-colors duration-300"
                      style={{
                        background:
                          state === 'ok'
                            ? 'rgba(34,197,94,.12)'
                            : state === 'error'
                              ? 'rgba(239,68,68,.12)'
                              : 'rgba(245,158,11,.12)',
                        color: state === 'ok' ? '#4ade80' : state === 'error' ? '#f87171' : '#fbbf24',
                        border:
                          state === 'ok'
                            ? '1px solid rgba(34,197,94,.25)'
                            : state === 'error'
                              ? '1px solid rgba(239,68,68,.25)'
                              : '1px solid rgba(245,158,11,.25)',
                      }}
                    >
                      Porta {port} · {label}
                    </span>
                  );
                })}
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
  onAdd,
}: {
  group: any;
  onBack: () => void;
  onEdit: (client: any) => void;
  onAdd: () => void;
}) => {
  const [clients, setClients]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [testing, setTesting]     = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [sortKey, setSortKey]     = useState<'name' | 'status' | 'last_test'>('status');
  const [sortAsc, setSortAsc]     = useState(true);
  const [showCritical, setShowCritical] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>(null);

  const load = useCallback(async () => {
    try {
      const res = await getClients(group.id);
      setClients(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  const applyClientResult = useCallback((id: number, result: any) => {
    setClients((prev) =>
      prev.map((client) => (client.id === id ? { ...client, ...normalizeTestResult(result) } : client))
    );
  }, []);

  const handleTestAll = async () => {
    if (!clients.length) return;
    setTesting(true);
    const startedAt = Date.now();
    setBatchProgress({ total: clients.length, completed: 0, currentName: '', finished: false, etaSeconds: 0 });
    try {
      for (let index = 0; index < clients.length; index += 1) {
        const target = clients[index];
        setTestingId(target.id);
        setBatchProgress((prev) => (prev ? { ...prev, currentName: target.name, completed: index } : prev));

        try {
          const response = await testClient(target.id);
          applyClientResult(target.id, response.data);
        } catch (e) {
          console.error(e);
        } finally {
          const completed = index + 1;
          const elapsedMs = Date.now() - startedAt;
          const avgMsPerClient = elapsedMs / completed;
          const remaining = Math.max(clients.length - completed, 0);
          const etaSeconds = Math.max(0, Math.round((avgMsPerClient * remaining) / 1000));
          setBatchProgress((prev) =>
            prev ? { ...prev, completed, currentName: target.name, etaSeconds } : prev
          );
        }
      }
      setBatchProgress((prev) =>
        prev ? { ...prev, currentName: '', finished: true, completed: prev.total, etaSeconds: 0 } : prev
      );
      setTimeout(() => setBatchProgress(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setTestingId(null);
      setTesting(false);
    }
  };

  const handleTestOne = async (id: number) => {
    setTestingId(id);
    try {
      const response = await testClient(id);
      applyClientResult(id, response.data);
    }
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
        <div className="flex gap-2">
          <button
            onClick={handleTestAll}
            disabled={testing || clients.length === 0}
            className="btn btn-success"
          >
            {testing ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
            {testing ? 'Testando...' : 'Testar Todos'}
          </button>
          <button
            onClick={onAdd}
            className="btn btn-primary"
          >
            <Plus size={14} /> Novo Cliente
          </button>
        </div>
      </div>

      <BatchProgressBar progress={batchProgress} />

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
              Clique em <strong>Novo Cliente</strong> acima para adicionar.
            </p>
          </div>
        ) : (
          (() => {
            const sortedClients = [...clients].sort((a, b) => {
              const statusDiff = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
              if (statusDiff !== 0) return statusDiff;
              let va = a[sortKey], vb = b[sortKey];
              if (sortKey === 'last_test') {
                va = va ? new Date(va).getTime() : 0;
                vb = vb ? new Date(vb).getTime() : 0;
              } else if (sortKey === 'status') {
                va = STATUS_RANK[a.status] ?? 99;
                vb = STATUS_RANK[b.status] ?? 99;
              } else if (typeof va === 'string') va = va.toLowerCase();
              if (typeof vb === 'string' && sortKey !== 'status') vb = vb.toLowerCase();
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
  const [showClientModal, setShowClientModal] = useState(false);
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
          onEdit={(c) => { setEditClient(c); setShowClientModal(true); }}
          onAdd={() => { setEditClient({ group_id: selected.id }); setShowClientModal(true); }}
        />
        {showClientModal && (
          <ClientModal
            client={editClient}
            groups={groups}
            onClose={() => { setEditClient(null); setShowClientModal(false); }}
            onSave={() => { setEditClient(null); setShowClientModal(false); loadGroups(); }}
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
