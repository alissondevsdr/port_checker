import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, Edit2, Trash2,
  Play, Zap, Clock, ChevronDown, ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { getClients, testClient, deleteClient, getGroups } from '../services/api';
import ClientModal from '../components/ClientModal';

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

type Sort = 'name' | 'status' | 'last_test' | 'avg_response_ms';

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

// ── ClientCard ────────────────────────────────────────────────────────────────

const ClientCard = ({
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
    <div
      className="px-5 py-4 transition-all duration-300"
      style={{
        borderBottom: '1px solid #333333',
        background: isTesting ? 'rgba(245,158,11,.07)' : 'transparent',
        borderLeft: client.status === 'ERROR' && !isTesting ? '2px solid rgba(239,68,68,.45)' : '2px solid transparent',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.015)'; }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = isTesting
          ? 'rgba(245,158,11,.07)'
          : 'transparent';
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`${isTesting ? 'dot dot-pending' : statusDot(client.status)} mt-2 flex-shrink-0`} />

        <div className="flex-1 min-w-0">
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
            {ports.map((p: number) => {
              const state = getPortState(p);
              const label =
                state === 'ok' ? '🟢 Aberta' : state === 'error' ? '🔴 Fechada' : '🟡 Testando...';
              return (
                <span
                  key={p}
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
                  Porta {p} · {label}
                </span>
              );
            })}
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
              <button onClick={onTest} disabled={testing} className="btn btn-ghost" style={{ padding: '6px 10px' }} title="Testar">
                {testing ? <RefreshCw size={13} className="spin" /> : <Play size={13} />}
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
  );
};

// ── Clients (main view) ───────────────────────────────────────────────────────

const Clients: React.FC = () => {
  const [clients, setClients]     = useState<any[]>([]);
  const [groups, setGroups]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterGroup, setFGroup]  = useState('');
  const [filterStatus, setFStatus]= useState('');
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testingAll, setTestAll]  = useState(false);
  const [modal, setModal]         = useState(false);
  const [editClient, setEdit]     = useState<any>(null);
  const [sortKey, setSortKey]     = useState<Sort>('status');
  const [sortAsc, setSortAsc]     = useState(true);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>(null);

  const load = useCallback(async () => {
    try {
      const [cR, gR] = await Promise.all([getClients(), getGroups()]);
      setClients(cR.data);
      setGroups(gR.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const applyClientResult = useCallback((id: number, result: any) => {
    setClients((prev) =>
      prev.map((client) => (client.id === id ? { ...client, ...normalizeTestResult(result) } : client))
    );
  }, []);

  const runBatchTest = useCallback(async (targets: any[]) => {
    if (!targets.length) return;

    setTestAll(true);
    const startedAt = Date.now();
    setBatchProgress({ total: targets.length, completed: 0, currentName: '', finished: false, etaSeconds: 0 });

    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      setBatchProgress((prev) =>
        prev ? { ...prev, currentName: target.name, completed: index } : prev
      );
      setTestingId(target.id);

      try {
        const response = await testClient(target.id);
        applyClientResult(target.id, response.data);
      } catch (e) {
        console.error(e);
      } finally {
        const completed = index + 1;
        const elapsedMs = Date.now() - startedAt;
        const avgMsPerClient = elapsedMs / completed;
        const remaining = Math.max(targets.length - completed, 0);
        const etaSeconds = Math.max(0, Math.round((avgMsPerClient * remaining) / 1000));
        setBatchProgress((prev) =>
          prev ? { ...prev, completed, currentName: target.name, etaSeconds } : prev
        );
      }
    }

    setTestingId(null);
    setTestAll(false);
    setBatchProgress((prev) =>
      prev ? { ...prev, currentName: '', finished: true, completed: prev.total, etaSeconds: 0 } : prev
    );
    setTimeout(() => setBatchProgress(null), 4000);
  }, [applyClientResult]);

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const response = await testClient(id);
      applyClientResult(id, response.data);
    }
    finally { setTestingId(null); }
  };

  const handleTestAll = async () => {
    await runBatchTest(clients);
  };

  const handleDelete = async (id: number) => {
    try { await deleteClient(id); await load(); }
    catch (e: any) { alert('Erro ao excluir: ' + e.message); }
  };

  const toggleSort = (k: Sort) => {
    if (sortKey === k) setSortAsc(a => !a);
    else { setSortKey(k); setSortAsc(true); }
  };

  const filtered = [...clients]
    .filter(c => {
      const q = search.toLowerCase();
      const mQ = !q || c.name.toLowerCase().includes(q) || c.host.toLowerCase().includes(q) || (c.cnpj || '').includes(q) || (c.phone || '').includes(q);
      const mG = !filterGroup  || String(c.group_id) === filterGroup;
      const mS = !filterStatus || c.status === filterStatus;
      return mQ && mG && mS;
    })
    .sort((a, b) => {
      const statusDiff = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      let va = a[sortKey] ?? '', vb = b[sortKey] ?? '';
      if (sortKey === 'status') {
        va = STATUS_RANK[a.status] ?? 99;
        vb = STATUS_RANK[b.status] ?? 99;
      } else {
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
      }
      return sortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });

  const SIcon = ({ k }: { k: Sort }) => (
    sortKey === k
      ? (sortAsc ? <ChevronUp size={11} style={{ color: '#ed0c00' }} /> : <ChevronDown size={11} style={{ color: '#ed0c00' }} />)
      : <ChevronDown size={11} style={{ color: '#888888' }} />
  );

  const ok  = clients.filter(c => c.status === 'OK').length;
  const err = clients.filter(c => c.status === 'ERROR').length;

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Clientes</h2>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            {clients.length} cadastrados ·{' '}
            <span style={{ color: '#22c55e' }}>{ok} OK</span>
            {err > 0 && <> · <span style={{ color: '#ef4444' }}>{err} com erro</span></>}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleTestAll}
            disabled={testingAll || clients.length === 0}
            className="btn btn-success"
          >
            {testingAll ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
            {testingAll ? 'Testando...' : 'Testar Todos os Clientes'}
          </button>
          <button
            onClick={() => { setEdit(null); setModal(true); }}
            className="btn btn-primary"
          >
            <Plus size={14} /> Novo Cliente
          </button>
        </div>
      </div>

      <BatchProgressBar progress={batchProgress} />

      {/* Filters */}
      <div className="card overflow-hidden mb-0" style={{ borderRadius: '12px 12px 0 0', borderBottom: 'none' }}>
        <div className="px-4 py-3 flex flex-col sm:flex-row gap-3" style={{ borderBottom: '1px solid #1a1a2a' }}>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
            <input
              className="field !pl-9 text-sm"
              placeholder="Buscar por nome, host, CNPJ ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="field text-xs appearance-none cursor-pointer"
              style={{ minWidth: 130 }}
              value={filterGroup}
              onChange={e => setFGroup(e.target.value)}
            >
              <option value="">Todos os Grupos</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select
              className="field text-xs appearance-none cursor-pointer"
              style={{ minWidth: 120 }}
              value={filterStatus}
              onChange={e => setFStatus(e.target.value)}
            >
              <option value="">Todo Status</option>
              <option value="OK">OK</option>
              <option value="ERROR">Erro</option>
              <option value="PENDING">Pendente</option>
            </select>
          </div>
        </div>

        {/* Sort bar */}
        <div
          className="px-5 py-2 flex items-center gap-6 text-xs font-semibold uppercase tracking-widest select-none"
          style={{ background: 'rgba(0,0,0,.2)', borderBottom: '1px solid #333333', color: '#aaaaaa' }}
        >
          {([
            ['name', 'Cliente'],
            ['status', 'Status'],
            ['last_test', 'Último Teste'],
            ['avg_response_ms', 'Latência'],
          ] as [Sort, string][]).map(([k, label]) => (
            <button
              key={k}
              className="flex items-center gap-1 cursor-pointer transition-colors"
              style={{ color: sortKey === k ? '#94a3b8' : '#475569' }}
              onClick={() => toggleSort(k)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = sortKey === k ? '#94a3b8' : '#475569'; }}
            >
              {label} <SIcon k={k} />
            </button>
          ))}
        </div>
      </div>

      {/* Client cards */}
      <div className="card overflow-hidden" style={{ borderRadius: '0 0 12px 12px' }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 animate-pulse" style={{ borderBottom: '1px solid #1a1a2a' }}>
              <div className="flex gap-3 items-start">
                <div className="dot bg-slate-800 mt-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded bg-slate-800 w-52" />
                  <div className="h-3 rounded bg-slate-800 w-80" />
                  <div className="h-3 rounded bg-slate-800 w-64" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle size={32} style={{ color: '#1e293b', margin: '0 auto 12px' }} />
            <p className="text-sm" style={{ color: '#475569' }}>
              {clients.length === 0 ? 'Nenhum cliente cadastrado.' : 'Nenhum resultado para os filtros.'}
            </p>
          </div>
        ) : (
          filtered.map(c => (
            <ClientCard
              key={c.id}
              client={c}
              testing={testingId === c.id}
              onTest={() => handleTest(c.id)}
              onEdit={() => { setEdit(c); setModal(true); }}
              onDelete={() => handleDelete(c.id)}
            />
          ))
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-2.5 text-xs" style={{ color: '#334155', borderTop: '1px solid #1a1a2a' }}>
            {filtered.length} de {clients.length} clientes
          </div>
        )}
      </div>

      {modal && (
        <ClientModal
          client={editClient}
          groups={groups}
          onClose={() => { setModal(false); setEdit(null); }}
          onSave={() => { setModal(false); setEdit(null); load(); }}
        />
      )}
    </div>
  );
};

export default Clients;
