import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Box,
  Download,
  FileArchive,
  FileCode2,
  FileSpreadsheet,
  FileText,
  HardDriveDownload,
  Info,
  Package,
  Printer,
  Search,
  Shield,
} from "lucide-react";
import {
  getDownloadUrl,
  getDownloads,
  type DownloadFile,
} from "../services/api";

type SortMode = "modified-desc" | "name-asc" | "size-desc";
type TabType = "general" | "drivers";

const iconByExtension: Record<
  string,
  React.ComponentType<{ size?: number; style?: React.CSSProperties }>
> = {
  exe: Shield,
  msi: Package,
  zip: FileArchive,
  rar: FileArchive,
  pdf: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  bat: FileCode2,
};

const prettyDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

const getExtension = (filename: string) => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.at(-1)!.toLowerCase() : "";
};

const copyToClipboard = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

// Mapeamento de descrições personalizadas por nome de arquivo
const TOOL_DESCRIPTIONS: Record<string, string> = {
  "Instalador Inovar.rar":
    "Ferramenta para realizar a instalação do sistema em novos clientes.",
  "Conversao Impostos Simples.exe":
    "Utilitário para conversão de arquivos de impostos no formato Simples Nacional.",
  "Restaurar.exe": "Ferramenta para restaurar backups de clientes.",
  "Conversão Inovar.rar":
    "Utilitário para conversão de produtos, estoque, clientes e fornecedores do sistema Inovar.",
  "dbMonitor.exe": "Ferramenta para monitoramento de bancos de dados.",
  "Tabelas Maiusculas.exe":
    "Utilitário para padronizar tabelas do banco de dados com letras maiúsculas.",
  "Remover Serviço MariaDB.bat":
    "Script para remover o serviço do MariaDB em casos de falhas na instalação ou desinstalação.",
  "Instalar serviço MariaDB.bat":
    "Script para instalar o serviço do MariaDB, garantindo que o banco de dados funcione corretamente.",
  "Instalador MariaDB.msi":
    "Instalador do MariaDB 10.1, utilizado como banco de dados para o sistema.",
  "EPSON TM T20X.zip":
    "Driver oficial da impressora térmica EPSON TM T20X, compatível com sistemas Windows.",
  "Gestao Comercial.rar": "Pasta do Gestão Comercial",
  "Inovar Vendas Nfce.rar": "Pasta do Inovar Vendas NFC-e",
  "Config.rar": "Pasta que necessita estar em C:Backup para funcionamento correto de algumas integrações",
  "Xampp.rar": "Instalador do XAMPP",
  "Banco PDV Corrompido.rar": "Utilitário para recuperar bancos de dados corrompidos do PDV", 
  "Bematech MP4200 ADV.rar": "Driver oficial da impressora térmica Bematech MP-4200 TH, compatível com sistemas Windows.",
  "Bematech MP4200 HS.rar": "Driver oficial da impressora térmica Bematech MP4200 HS, compatível com sistemas Windows.",
  "Bematech MP4200 TH.rar": "Driver oficial da impressora térmica Bematech MP4200 TH, compatível com sistemas Windows.",
  "Epson TM-T20 II.rar": "Driver oficial da impressora térmica Epson TM-T20II, compatível com sistemas Windows.",
  "Epson TM-T20.rar": "Driver oficial da impressora térmica Epson TM-T20, compatível com sistemas Windows.",
  "Epson TM-T20X.rar": "Driver oficial da impressora térmica Epson TM-T20X, compatível com sistemas Windows.",
  "Elgin i9.rar": "Driver oficial da impressora térmica Elgin i9, compatível com sistemas Windows.",
  "Elgin i9 Full.rar": "Driver completo da impressora térmica Elgin i9 full, compatível com sistemas Windows.",
  "Elgin i8.rar": "Driver oficial da impressora térmica Elgin i8, compatível com sistemas Windows.",


  // Adicione mais arquivos e descrições aqui seguindo o padrão:
  // "nome_do_arquivo.extensao": "Sua descrição personalizada aqui",
};

const Downloads: React.FC = () => {
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [counts, setCounts] = useState<{ general: number; drivers: number }>({
    general: 0,
    drivers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("modified-desc");
  const [copiedFile, setCopiedFile] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return (
      (localStorage.getItem("downloads_active_tab") as TabType) || "general"
    );
  });
  const [showInfo, setShowInfo] = useState<string | null>(null);

  const getFileDescription = (filename: string) => {
    return (
      TOOL_DESCRIPTIONS[filename] ||
      "Ferramenta de suporte técnico destinada ao uso interno. Desenvolvida para facilitar processos de manutenção e configuração."
    );
  };

  const loadCounts = async () => {
    try {
      const [gen, dri] = await Promise.all([
        getDownloads("general"),
        getDownloads("drivers"),
      ]);
      setCounts({
        general: gen.data?.length || 0,
        drivers: dri.data?.length || 0,
      });
    } catch (err) {
      console.error("Erro ao carregar contagem de arquivos:", err);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  useEffect(() => {
    localStorage.setItem("downloads_active_tab", activeTab);
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getDownloads(activeTab);
        setFiles(res.data || []);
        // Update specific count for active tab too
        setCounts((prev) => ({ ...prev, [activeTab]: res.data?.length || 0 }));
      } catch (err: any) {
        setError(err.message || "Não foi possível carregar os downloads.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeTab]);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = files.filter(
      (file) => !q || file.filename.toLowerCase().includes(q),
    );

    if (sortMode === "name-asc") {
      return [...list].sort((a, b) =>
        a.filename.localeCompare(b.filename, "pt-BR"),
      );
    }

    if (sortMode === "size-desc") {
      return [...list].sort((a, b) => b.sizeBytes - a.sizeBytes);
    }

    return [...list].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  }, [files, search, sortMode]);

  const handleCopyLink = async (filename: string) => {
    try {
      const url = getDownloadUrl(
        filename,
        activeTab === "drivers" ? "drivers" : undefined,
      );
      await copyToClipboard(url);
      setCopiedFile(filename);
      setTimeout(() => setCopiedFile(""), 1200);
    } catch {
      setError("Não foi possível copiar o link deste arquivo.");
    }
  };

  return (
    <div className="fade-up max-w-6xl mx-auto">
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-1">
          <HardDriveDownload size={28} style={{ color: "#ed0c00" }} />
          <h2 className="text-3xl font-bold text-white"> Downloads</h2>
        </div>
        <p className="text-base" style={{ color: "#475569", paddingLeft: 34 }}>
          Hub interno de utilitários da equipe
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-3 mb-5">
        <div className="relative w-full lg:flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#64748b" }}
          />
          <input
            className="field !pl-10 h-11 text-sm w-full transition-all focus:ring-1 focus:ring-[#ed0c00]/30"
            placeholder="Buscar arquivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex w-full lg:w-auto gap-3">
          <select
            className="field h-11 text-sm flex-1 lg:w-48"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="modified-desc">Recentes</option>
            <option value="name-asc">Nome A-Z</option>
            <option value="size-desc">Tamanho</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setActiveTab("general")}
          className={`h-14 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 border ${
            activeTab === "general"
              ? "bg-[#ed0c00] text-white border-[#ed0c00] shadow-lg shadow-[#ed0c00]/20"
              : "bg-[#111111] text-[#64748b] border-[#222222] hover:border-[#333333] hover:text-white"
          }`}
        >
          <Box size={20} />
          GERAL
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold min-w-[22px] ${activeTab === "general" ? "bg-white/20 text-white" : "bg-white/5 text-[#475569]"}`}
          >
            {counts.general}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("drivers")}
          className={`h-14 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 border ${
            activeTab === "drivers"
              ? "bg-[#ed0c00] text-white border-[#ed0c00] shadow-lg shadow-[#ed0c00]/20"
              : "bg-[#111111] text-[#64748b] border-[#222222] hover:border-[#333333] hover:text-white"
          }`}
        >
          <Printer size={20} />
          DRIVER
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold min-w-[22px] ${activeTab === "drivers" ? "bg-white/20 text-white" : "bg-white/5 text-[#475569]"}`}
          >
            {counts.drivers}
          </span>
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card p-4 animate-pulse">
              <div className="h-4 rounded bg-slate-800 w-10 mb-3" />
              <div className="h-4 rounded bg-slate-800 w-44 mb-2" />
              <div className="h-3 rounded bg-slate-800 w-32 mb-4" />
              <div className="h-9 rounded bg-slate-800 w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="card py-12 text-center px-6 border-dashed border-2 border-[#333]">
          <AlertCircle
            size={34}
            style={{ color: "#ed0c00", margin: "0 auto 10px" }}
          />
          <p className="text-sm text-white">Falha ao carregar os arquivos.</p>
          <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
            {error}
          </p>
        </div>
      )}

      {!loading && !error && filteredFiles.length === 0 && (
        <div className="card py-14 text-center px-6 border-dashed border-2 border-[#222]">
          <Box size={34} style={{ color: "#475569", margin: "0 auto 10px" }} />
          <p className="text-sm text-white font-medium">
            {files.length === 0
              ? `Nenhum arquivo disponível na pasta ${activeTab === "general" ? "geral" : "de drivers"}.`
              : "Nenhum arquivo encontrado com esse filtro."}
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-4 text-xs font-bold text-[#ed0c00] hover:underline"
          >
            Limpar busca
          </button>
        </div>
      )}

      {!loading && !error && filteredFiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFiles.map((file, idx) => {
            const ext = getExtension(file.filename);
            const Icon = iconByExtension[ext] || FileText;
            const directUrl = getDownloadUrl(
              file.filename,
              activeTab === "drivers" ? "drivers" : undefined,
            );

            return (
              <div
                key={file.filename}
                className={`card p-4 transition-all group animate-fade-up-${Math.min(idx, 5)}`}
                style={{ position: "relative", overflow: "hidden" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "#444444";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "#333333";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[#ed0c00]/20"
                    style={{ background: "rgba(237, 12, 0, 0.1)" }}
                  >
                    <Icon size={20} style={{ color: "#ed0c00" }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setShowInfo(
                          showInfo === file.filename ? null : file.filename,
                        )
                      }
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                        showInfo === file.filename
                          ? "bg-blue-600 text-white scale-110 shadow-blue-500/40"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 hover:scale-110"
                      }`}
                      title="Informações da ferramenta"
                    >
                      <Info
                        size={14}
                        className={
                          showInfo === file.filename ? "" : "animate-pulse"
                        }
                      />
                    </button>
                    <span
                      className="text-[10px] px-2 h-7 flex items-center rounded font-bold uppercase tracking-widest"
                      style={{
                        background: "rgba(255,255,255,.05)",
                        color: "#888888",
                        border: "1px solid #222",
                      }}
                    >
                      {ext || "arquivo"}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white break-all leading-5 min-h-[40px]">
                  {file.filename}
                </h3>

                {showInfo === file.filename ? (
                  <div className="mt-3 p-2.5 rounded bg-blue-500/10 border border-blue-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-[11px] text-blue-200 leading-relaxed">
                      {getFileDescription(file.filename)}
                    </p>
                  </div>
                ) : (
                  <div
                    className="mt-3 pt-3 border-t border-white/5 text-[11px] space-y-1.5"
                    style={{ color: "#94a3b8" }}
                  >
                    <div className="flex justify-between">
                      <span>Tamanho</span>
                      <span className="text-white font-medium">
                        {file.size}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Atualizado</span>
                      <span className="text-white font-medium">
                        {prettyDate(file.modifiedAt)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <a
                    href={directUrl}
                    className="btn btn-primary justify-center h-9 text-xs"
                    download
                  >
                    <Download size={13} />
                    Baixar
                  </a>
                  <button
                    type="button"
                    className="btn btn-ghost justify-center h-9 text-xs border-[#333]"
                    onClick={() => handleCopyLink(file.filename)}
                  >
                    {copiedFile === file.filename ? "Copiado!" : "Link"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Downloads;
