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
  Package,
  Search,
  Shield,
} from "lucide-react";
import { getDownloadUrl, getDownloads, type DownloadFile } from "../services/api";

type SortMode = "modified-desc" | "name-asc" | "size-desc";

const iconByExtension: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
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

const Downloads: React.FC = () => {
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("modified-desc");
  const [copiedFile, setCopiedFile] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getDownloads();
        setFiles(res.data || []);
      } catch (err: any) {
        setError(err.message || "Não foi possível carregar os downloads.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = files.filter((file) => !q || file.filename.toLowerCase().includes(q));

    if (sortMode === "name-asc") {
      return [...list].sort((a, b) => a.filename.localeCompare(b.filename, "pt-BR"));
    }

    if (sortMode === "size-desc") {
      return [...list].sort((a, b) => b.sizeBytes - a.sizeBytes);
    }

    return [...list].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  }, [files, search, sortMode]);

  const handleCopyLink = async (filename: string) => {
    try {
      const url = getDownloadUrl(filename);
      await copyToClipboard(url);
      setCopiedFile(filename);
      setTimeout(() => setCopiedFile(""), 1200);
    } catch {
      setError("Não foi possível copiar o link deste arquivo.");
    }
  };

  return (
    <div className="fade-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDriveDownload size={20} style={{ color: "#ed0c00" }} />
            Downloads
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#475569" }}>
            Hub interno de utilitários da equipe
          </p>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-widest w-fit"
          style={{ background: "rgba(255,255,255,.05)", color: "#cbd5e1", border: "1px solid #333333" }}
        >
          {files.length} arquivos
        </span>
      </div>

      <div className="card p-3 mb-5 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#475569" }}
          />
          <input
            className="field !pl-9 text-sm"
            placeholder="Buscar arquivo por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="field text-sm md:w-64"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
        >
          <option value="modified-desc">Mais recentes</option>
          <option value="name-asc">Nome (A-Z)</option>
          <option value="size-desc">Maior tamanho</option>
        </select>
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
        <div className="card py-12 text-center px-6">
          <AlertCircle size={34} style={{ color: "#ed0c00", margin: "0 auto 10px" }} />
          <p className="text-sm text-white">Falha ao carregar os arquivos.</p>
          <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{error}</p>
        </div>
      )}

      {!loading && !error && filteredFiles.length === 0 && (
        <div className="card py-14 text-center px-6">
          <Box size={34} style={{ color: "#475569", margin: "0 auto 10px" }} />
          <p className="text-sm text-white">
            {files.length === 0
              ? "Nenhum arquivo disponível na pasta de downloads."
              : "Nenhum arquivo encontrado com esse filtro."}
          </p>
        </div>
      )}

      {!loading && !error && filteredFiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFiles.map((file) => {
            const ext = getExtension(file.filename);
            const Icon = iconByExtension[ext] || FileText;
            const directUrl = getDownloadUrl(file.filename);

            return (
              <div
                key={file.filename}
                className="card p-4 transition-all"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#444444";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#333333";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(237, 12, 0, 0.14)" }}
                  >
                    <Icon size={18} style={{ color: "#ed0c00" }} />
                  </div>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest"
                    style={{ background: "rgba(255,255,255,.05)", color: "#888888" }}
                  >
                    {ext || "arquivo"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white break-all leading-5">{file.filename}</h3>

                <div className="mt-2 text-xs space-y-1" style={{ color: "#94a3b8" }}>
                  <p>Tamanho: {file.size}</p>
                  <p>Atualizado: {prettyDate(file.modifiedAt)}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a href={directUrl} className="btn btn-primary justify-center" download>
                    <Download size={13} />
                    Baixar
                  </a>
                  <button
                    type="button"
                    className="btn btn-ghost justify-center"
                    onClick={() => handleCopyLink(file.filename)}
                  >
                    {copiedFile === file.filename ? "Copiado" : "Copiar Link"}
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
