import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, Edit2, Trash2,
  Play, Globe, Zap,
  Phone, Wifi, Clock, ChevronDown, ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { getClients, testClient, deleteClient, getGroups, testAllClients } from '../services/api';
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

  return (
    <div
      className="px-5 py-4 transition-colors"
      style={{
        borderBottom: '1px solid #1a1a2a',
        background: client.status === 'ERROR' ? 'rgba(239,68,68,.02)' : 'transparent',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.015)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = client.status === 'ERROR' ? 'rgba(239,68,68,.02)' : 'transparent'; }}
    >
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <div className={`${statusDot(client.status)} mt-2 flex-shrink-0`} />

        {/* Info block */}
        <div className="flex-1 min-w-0">

          {/* Row 1: name + status + CNPJ */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-white">{client.name}</span>
            <span className={statusChip(client.status)}>{client.status}</span>
            {client.group_name && (
              <span
                className="text-xs px-2 py-0.5 rounded font-semibold"
                style={{ background: 'rgba(59,130,246,.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,.15)' }}
              >
                {client.group_name}
              </span>
            )}
            {client.cnpj && (
              <span className="font-mono text-xs" style={{ color: '#475569' }}>
                {client.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
              </span>
            )}
          </div>

          {/* Row 2: host + ports */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 font-mono text-xs" style={{ color: '#6b7280' }}>
              <Globe size={11} style={{ color: '#3b82f6' }} />
              {client.host}
            </span>
            {(client.ports || []).length > 0 && (
              <>
                <span className="text-xs" style={{ color: '#374151' }}>|</span>
                <div className="flex gap-1 flex-wrap">
                  {(client.ports || []).map((p: number) => (
                    <span key={p} className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: '#1a1a2a', color: '#6b7280', border: '1px solid #252535' }}>
                      :{p}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Row 3: contact + timing */}
          <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs" style={{ color: '#475569' }}>
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
                className="flex items-center gap-1 transition-colors"
                style={{ color: '#475569' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#22c55e'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#475569'; }}
                title="Abrir no WhatsApp"
              >
                <Phone size={10} /> {client.phone}
              </a>
            )}
            {client.ip_interno && (
              <span className="font-mono">{client.ip_interno}</span>
            )}
            {client.last_test ? (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {new Date(client.last_test).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            ) : (
              <span style={{ color: '#334155', fontStyle: 'italic' }}>Nunca testado</span>
            )}
            {client.avg_response_ms && (
              <span className="font-mono" style={{ color: '#3b82f6' }}>
                {Math.round(client.avg_response_ms)}ms
              </span>
            )}
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
  const [sortKey, setSortKey]     = useState<Sort>('name');
  const [sortAsc, setSortAsc]     = useState(true);

  const load = useCallback(async () => {
    try {
      const [cR, gR] = await Promise.all([getClients(), getGroups()]);
      setClients(cR.data);
      setGroups(gR.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTest = async (id: number) => {
    setTestingId(id);
    try { await testClient(id); await load(); }
    finally { setTestingId(null); }
  };

  const handleTestAll = async () => {
    setTestAll(true);
    try { await testAllClients(); await load(); }
    finally { setTestAll(false); }
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
      let va = a[sortKey] ?? '', vb = b[sortKey] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return sortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });

  const SIcon = ({ k }: { k: Sort }) => (
    sortKey === k
      ? (sortAsc ? <ChevronUp size={11} style={{ color: '#60a5fa' }} /> : <ChevronDown size={11} style={{ color: '#60a5fa' }} />)
      : <ChevronDown size={11} style={{ color: '#334155' }} />
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
            {testingAll ? 'Testando...' : 'Testar Todos'}
          </button>
          <button
            onClick={() => { setEdit(null); setModal(true); }}
            className="btn btn-primary"
          >
            <Plus size={14} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card overflow-hidden mb-0" style={{ borderRadius: '12px 12px 0 0', borderBottom: 'none' }}>
        <div className="px-4 py-3 flex flex-col sm:flex-row gap-3" style={{ borderBottom: '1px solid #1a1a2a' }}>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
            <input
              className="field pl-9 text-sm"
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
          style={{ background: 'rgba(0,0,0,.2)', borderBottom: '1px solid #1a1a2a', color: '#475569' }}
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
