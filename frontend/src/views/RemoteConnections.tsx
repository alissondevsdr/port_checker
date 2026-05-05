import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Monitor,
  ChevronRight,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { 
  getRemoteCompanies, 
  deleteRemoteCompany, 
  getRemoteConnections, 
  deleteRemoteConnection 
} from "../services/api";
import RemoteCompanyModal from "../components/RemoteCompanyModal";
import RemoteConnectionModal from "../components/RemoteConnectionModal";

// ── RemoteCompanyCard ────────────────────────────────────────────────────────

const RemoteCompanyCard = ({
  company,
  onClick,
  onEdit,
  onDelete,
}: {
  company: any;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div
      className="px-5 py-4 transition-colors cursor-pointer group"
      style={{
        borderBottom: "1px solid #333333",
        background: "transparent",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          "rgba(255,255,255,.015)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Building2 size={20} style={{ color: "#ed0c00" }} />
        </div>

        {/* Info block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-white">
              {company.name}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
              style={{ background: 'rgba(255,255,255,.05)', color: '#888888' }}
            >
              {company.connections_count || 0} conexões
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {confirmDel ? (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "rgba(239,68,68,.1)",
                border: "1px solid rgba(239,68,68,.2)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <span style={{ color: "#ed0c00" }}>Excluir?</span>
              <button
                onClick={onDelete}
                className="font-bold underline"
                style={{ color: "#ed0c00" }}
              >
                Sim
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                style={{ color: "#cccccc" }}
              >
                Não
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                <button
                  onClick={onEdit}
                  className="btn btn-ghost p-2"
                  title="Editar Empresa"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => setConfirmDel(true)}
                  className="btn btn-danger p-2"
                  title="Excluir Empresa"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="ml-1 text-slate-600 group-hover:text-slate-400 transition-colors">
                <ChevronRight size={18} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [copied, setCopied] = useState(false);

  const getSoftwareColor = (type: string) => {
    if (type === "AnyDesk")
      return {
        bg: "rgba(59, 130, 246, .1)",
        color: "#3b82f6",
        border: "1px solid rgba(59, 130, 246, .15)",
      };
    if (type === "Rustdesk")
      return {
        bg: "rgba(168, 85, 247, .1)",
        color: "#a855f7",
        border: "1px solid rgba(168, 85, 247, .15)",
      };
    return {
      bg: "rgba(107, 114, 128, .1)",
      color: "#6b7280",
      border: "1px solid rgba(107, 114, 128, .15)",
    };
  };

  const getTypeColor = (type: string) => {
    if (type === "Servidor")
      return {
        bg: "rgba(246, 59, 59, 0.1)",
        color: "#f63b3b",
        border: "1px solid rgba(246, 59, 59, 0.15)",
      };
    if (type === "Estação")
      return {
        bg: "rgba(59, 246, 100, 0.1)",
        color: "#4bf63b",
        border: "1px solid rgba(59, 246, 84, 0.15)",
      };
    return {
      bg: "rgba(107, 114, 128, .1)",
      color: "#6b7280",
      border: "1px solid rgba(107, 114, 128, .15)",
    };
  };

  const softwareStyle = getSoftwareColor(connection.connection_software);
  const typeStyle = getTypeColor(connection.connection_type);

  const handleCopyConnection = async () => {
    const value = connection.connection_string || "";
    if (!value) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (e) {
      console.error("Erro ao copiar conexão:", e);
    }
  };
  
  return (
    <div
      className="px-5 py-4 transition-colors"
      style={{
        borderBottom: "1px solid #333333",
        background: "transparent",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-2 flex-shrink-0">
          <Monitor size={16} style={{ color: "#ed0c00" }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-white tracking-wider">
              {connection.connection_string}
            </span>
            <div className="relative group/copy">
              <button
                type="button"
                onClick={handleCopyConnection}
                className="btn btn-ghost p-1.5"
                title={copied ? "Copiado" : "Copiar conexão"}
                aria-label={copied ? "Conexão copiada" : "Copiar conexão"}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
              {!copied && (
                <span
                  className="pointer-events-none absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded px-2 py-1 text-[10px] font-semibold tracking-wide shadow-md opacity-0 transition-opacity duration-150 group-hover/copy:opacity-100"
                  style={{ background: "#111111", color: "#cbd5e1", border: "1px solid #1e293b" }}
                >
                  Copiar
                </span>
              )}
            </div>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest"
              style={softwareStyle}
            >
              {connection.connection_software}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest"
              style={typeStyle}
            >
              {connection.connection_type}
            </span>
          </div>

          <div
            className="flex items-center gap-4 mt-1 flex-wrap text-xs"
            style={{ color: "#666666" }}
          >
            <span>
              Adicionado em {connection.created_at &&
                new Date(connection.created_at).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {confirmDel ? (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "rgba(239,68,68,.1)",
                border: "1px solid rgba(239,68,68,.2)",
              }}
            >
              <span style={{ color: "#ed0c00" }}>Excluir?</span>
              <button
                onClick={onDelete}
                className="font-bold underline"
                style={{ color: "#ed0c00" }}
              >
                Sim
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                style={{ color: "#cccccc" }}
              >
                Não
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={onEdit}
                className="btn btn-ghost p-2"
                title="Editar Conexão"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => setConfirmDel(true)}
                className="btn btn-danger p-2"
                title="Excluir Conexão"
              >
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
  // Navigation state
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  
  // Data state
  const [companies, setCompanies] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{title: string, msg: string, type: 'success' | 'danger'} | null>(null);
  
  // Modals state
  const [companyModal, setCompanyModal] = useState(false);
  const [editCompany, setEditCompany] = useState<any>(null);
  const [connectionModal, setConnectionModal] = useState(false);
  const [editConnection, setEditConnection] = useState<any>(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRemoteCompanies();
      setCompanies(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConnections = useCallback(async (companyId: number) => {
    setLoading(true);
    try {
      const res = await getRemoteConnections(companyId);
      setConnections(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadConnections(selectedCompany.id);
    } else {
      loadCompanies();
    }
  }, [selectedCompany, loadCompanies, loadConnections]);

  const handleDeleteCompany = async (id: number) => {
    try {
      await deleteRemoteCompany(id);
      loadCompanies();
      setFeedback({ title: 'Sucesso', msg: 'Empresa removida com sucesso', type: 'success' });
    } catch (e: any) {
      setFeedback({ title: 'Erro ao excluir', msg: e.message, type: 'danger' });
    }
  };

  const handleDeleteConnection = async (id: number) => {
    try {
      await deleteRemoteConnection(id);
      if (selectedCompany) loadConnections(selectedCompany.id);
      setFeedback({ title: 'Sucesso', msg: 'Conexão removida com sucesso', type: 'success' });
    } catch (e: any) {
      setFeedback({ title: 'Erro ao excluir', msg: e.message, type: 'danger' });
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q);
  });

  const filteredConnections = connections.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.connection_string.toLowerCase().includes(q) ||
      c.connection_type.toLowerCase().includes(q) ||
      c.connection_software.toLowerCase().includes(q)
    );
  });

  const FeedbackToast = () => feedback ? (
    <div className="fixed bottom-8 right-8 z-[10001] animate-in slide-in-from-right duration-300">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
        feedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
      }`}>
        <AlertCircle size={20} />
        <div>
          <div className="font-bold text-sm">{feedback.title}</div>
          <div className="text-xs opacity-80">{feedback.msg}</div>
        </div>
        <button onClick={() => setFeedback(null)} className="ml-4 opacity-50 hover:opacity-100">
          <Check size={16} />
        </button>
      </div>
    </div>
  ) : null;

  // Render Connections View
  if (selectedCompany) {
    return (
      <div className="fade-up max-w-6xl mx-auto" key="connections-view">
        <FeedbackToast />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setSelectedCompany(null);
                setSearch("");
              }}
              className="btn btn-ghost p-2"
              title="Voltar para empresas"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 size={20} style={{ color: '#ed0c00' }} />
                {selectedCompany.name}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "#475569" }}>
                {connections.length} conexões cadastradas
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditConnection(null);
              setConnectionModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={14} /> Nova Conexão
          </button>
        </div>

        {/* Search bar */}
        <div
          className="card overflow-hidden mb-0"
          style={{ borderRadius: "12px 12px 0 0", borderBottom: "none" }}
        >
          <div
            className="px-4 py-3 flex flex-col"
            style={{ borderBottom: "1px solid #1a1a2a" }}
          >
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#475569" }}
              />
              <input
                className="field !pl-9 text-sm w-full"
                placeholder="Buscar por conexão, software ou tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div
          className="card overflow-hidden"
          style={{ borderRadius: "0 0 12px 12px" }}
        >
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse" style={{ borderBottom: "1px solid #1a1a2a" }}>
                <div className="flex gap-3 items-start">
                  <div className="dot bg-slate-800 mt-2" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded bg-slate-800 w-52" />
                    <div className="h-3 rounded bg-slate-800 w-80" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredConnections.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle size={32} style={{ color: "#1e293b", margin: "0 auto 12px" }} />
              <p className="text-sm" style={{ color: "#475569" }}>
                Nenhuma conexão cadastrada para esta empresa.
              </p>
            </div>
          ) : (
            filteredConnections.map((c) => (
              <RemoteConnectionCard
                key={c.id}
                connection={c}
                onEdit={() => {
                  setEditConnection(c);
                  setConnectionModal(true);
                }}
                onDelete={() => handleDeleteConnection(c.id)}
              />
            ))
          )}
        </div>

        {connectionModal && (
          <RemoteConnectionModal
            companyId={selectedCompany.id}
            connection={editConnection}
            onClose={() => {
              setConnectionModal(false);
              setEditConnection(null);
            }}
            onSave={() => {
              setConnectionModal(false);
              setEditConnection(null);
              loadConnections(selectedCompany.id);
            }}
          />
        )}
      </div>
    );
  }

  // Render Companies View
  return (
    <div className="fade-up max-w-6xl mx-auto" key="companies-view">
      <FeedbackToast />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Empresas (Conexões Remotas)</h2>
          <p className="text-sm mt-0.5" style={{ color: "#475569" }}>
            {companies.length} empresas cadastradas
          </p>
        </div>
        <button
          onClick={() => {
            setEditCompany(null);
            setCompanyModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={14} /> Nova Empresa
        </button>
      </div>

      {/* Search bar */}
      <div
        className="card overflow-hidden mb-0"
        style={{ borderRadius: "12px 12px 0 0", borderBottom: "none" }}
      >
        <div
          className="px-4 py-3 flex flex-col"
          style={{ borderBottom: "1px solid #1a1a2a" }}
        >
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#475569" }}
            />
            <input
              className="field !pl-9 text-sm w-full"
              placeholder="Buscar por nome da empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div
        className="card overflow-hidden"
        style={{ borderRadius: "0 0 12px 12px" }}
      >
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 animate-pulse" style={{ borderBottom: "1px solid #1a1a2a" }}>
              <div className="flex gap-3 items-start">
                <div className="dot bg-slate-800 mt-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded bg-slate-800 w-52" />
                </div>
              </div>
            </div>
          ))
        ) : filteredCompanies.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle size={32} style={{ color: "#1e293b", margin: "0 auto 12px" }} />
            <p className="text-sm" style={{ color: "#475569" }}>
              Nenhuma empresa cadastrada.
            </p>
          </div>
        ) : (
          filteredCompanies.map((c) => (
            <RemoteCompanyCard
              key={c.id}
              company={c}
              onClick={() => {
                setSelectedCompany(c);
                setSearch("");
              }}
              onEdit={() => {
                setEditCompany(c);
                setCompanyModal(true);
              }}
              onDelete={() => handleDeleteCompany(c.id)}
            />
          ))
        )}
      </div>

      {companyModal && (
        <RemoteCompanyModal
          company={editCompany}
          onClose={() => {
            setCompanyModal(false);
            setEditCompany(null);
          }}
          onSave={() => {
            setCompanyModal(false);
            setEditCompany(null);
            loadCompanies();
          }}
        />
      )}
    </div>
  );
};

export default RemoteConnections;
