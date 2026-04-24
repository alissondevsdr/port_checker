import React, { useEffect, useState } from 'react';
import {
  FileBarChart2, Download, Loader, CheckCircle,
  AlertCircle, Calendar, Database, Zap,
  ChevronRight, ClipboardList,
} from 'lucide-react';
import {
  generateFrigoReport,
  generatePadariaMonofasicoReport,
  generatePadariaSTReport,
  getRequesterIp,
} from '../services/api';

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const PADARIA_EMITENTES = [
  { value: 'BRUNETTO', label: 'Brunetto' },
  { value: 'A_C_COSTA', label: 'A.C Costa' },
] as const;
type PadariaEmitente = typeof PADARIA_EMITENTES[number]['value'];

const downloadBase64Excel = (result: any, fallbackName: string) => {
  if (!result?.file) return;
  const binaryStr = atob(result.file);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename || fallbackName;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

const isValidIPv4 = (value: string): boolean => {
  const ip = value.trim();
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return false;

  const parts = ip.split('.');
  return parts.every((part) => {
    if (part.length > 1 && part.startsWith('0')) return false;
    const n = Number(part);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
};

// ── FrigoReportCard ────────────────────────────────────────────────────────────

const FrigoReportCard: React.FC = () => {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [host, setHost] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDefaultIp = async () => {
      try {
        const res = await getRequesterIp();
        const detectedIp = String(res.data?.ip || '').trim();
        if (isValidIPv4(detectedIp)) {
          setHost((prev) => prev.trim() || detectedIp);
        }
      } catch {
        // Falha silenciosa: usuário ainda pode informar o IP manualmente.
      }
    };

    loadDefaultIp();
  }, []);

  const handleGenerate = async () => {
    const hostNormalized = host.trim();
    if (!isValidIPv4(hostNormalized)) {
      setError('Informe um IPv4 válido da máquina do colaborador (ex.: 192.168.1.25)');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await generateFrigoReport({ month, year, host: hostNormalized });
      if (res.data.success) {
        setResult(res.data);
      } else {
        setError(res.data.error || 'Erro ao gerar relatório');
      }
    } catch (e: any) {
      setError(e.message || 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    downloadBase64Excel(result, `OS_Frigo_${String(month).padStart(2, '0')}_${year}.xlsx`);
  };

  const monthName = MONTHS.find(m => m.value === month)?.label;

  return (
    <div className="card overflow-hidden">
      {/* Card header */}
      <div
        className="px-6 py-5 flex items-start justify-between gap-4"
        style={{ borderBottom: '1px solid #222222', background: 'rgba(237,12,0,.04)' }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(237,12,0,.12)', border: '1px solid rgba(237,12,0,.2)' }}
          >
            <ClipboardList size={22} style={{ color: '#ed0c00' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Ordens de Serviço</h3>
              <span
                className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest"
                style={{ background: 'rgba(237,12,0,.1)', color: '#ed0c00', border: '1px solid rgba(237,12,0,.15)' }}
              >
                fRIGO
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: '#888888' }}>
              Relatório de OS por período — banco <span className="font-mono" style={{ color: '#cccccc' }}>frigo</span>
            </p>

            {/* Colunas geradas */}
            {/* <div className="flex flex-wrap gap-1 mt-2">
              {['Nº OS', 'Situação', 'Placa', 'Cliente', 'Fantasia', 'CNPJ', 'Depto', 'Data', 'Valor', 'Ano', 'KM', 'Marca', 'Modelo', 'Cor'].map(col => (
                <span
                  key={col}
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: '#1a1a1a', color: '#aaaaaa', border: '1px solid #333333' }}
                >
                  {col}
                </span>
              ))}
            </div> */}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex flex-col gap-5">
        {/* Período */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={13} style={{ color: '#ed0c00' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#cccccc' }}>
              Mês de Competência
            </span>
          </div>
          <div className="flex gap-3">
            <select
              value={month}
              onChange={e => { setMonth(Number(e.target.value)); setResult(null); setError(null); }}
              className="field text-sm flex-1"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              min={2000}
              max={2099}
              onChange={e => { setYear(Number(e.target.value)); setResult(null); setError(null); }}
              className="field text-sm"
              style={{ width: 100 }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: '#555555' }}>
            Será gerado de 01/{String(month).padStart(2, '0')}/{year} até o último dia do mês
          </p>
        </div>

        {/* Host/IP */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database size={13} style={{ color: '#ed0c00' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#cccccc' }}>
            IP do Servidor
            </span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ex.: 192.168.1.25"
            value={host}
            onChange={e => { setHost(e.target.value); setResult(null); setError(null); }}
            className="field text-sm w-full"
          />
          <p className="text-xs mt-1.5" style={{ color: '#555555' }}>
            O relatório será consultado no banco <span className="font-mono">frigo</span> desse IP usando as credenciais do backend.
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg text-sm"
            style={{ background: 'rgba(239,68,68,.05)', border: '1px solid rgba(239,68,68,.2)' }}
          >
            <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
            <span style={{ color: '#fca5a5' }}>{error}</span>
          </div>
        )}

        {/* Sucesso */}
        {result && !loading && (
          <div
            className="p-4 rounded-lg flex items-start justify-between gap-4"
            style={{ background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.2)' }}
          >
            <div className="flex items-start gap-3">
              <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-semibold text-white">Relatório gerado com sucesso!</p>
                <p className="text-xs mt-0.5" style={{ color: '#86efac' }}>
                  <span className="font-bold">{result.totalRows}</span> ordens de serviço — {monthName}/{year}
                </p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="btn btn-success flex-shrink-0"
              style={{ padding: '7px 14px' }}
            >
              <Download size={13} />
              Baixar
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            className="p-4 rounded-lg flex items-center gap-3"
            style={{ background: 'rgba(237,12,0,.05)', border: '1px solid rgba(237,12,0,.15)' }}
          >
            <Loader size={16} style={{ color: '#ed0c00' }} className="spin" />
            <div>
              <p className="text-sm font-medium text-white">Gerando relatório...</p>
              <p className="text-xs" style={{ color: '#888888' }}>Consultando banco frigo no IP informado</p>
            </div>
          </div>
        )}

        {/* Gerar */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn btn-primary w-full justify-center"
        >
          {loading
            ? <><Loader size={14} className="spin" /> Gerando...</>
            : <><Zap size={14} /> Gerar Relatório — {monthName}/{year}</>
          }
        </button>
      </div>
    </div>
  );
};

const PadariaReportCard: React.FC<{
  title: string;
  description: string;
  badge: string;
  reportType: 'st' | 'monofasico';
}> = ({ title, description, badge, reportType }) => {
  const [emitente, setEmitente] = useState<PadariaEmitente>('BRUNETTO');
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [host, setHost] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDefaultIp = async () => {
      try {
        const res = await getRequesterIp();
        const detectedIp = String(res.data?.ip || '').trim();
        if (isValidIPv4(detectedIp)) {
          setHost((prev) => prev.trim() || detectedIp);
        }
      } catch {
        // Falha silenciosa: usuário ainda pode informar o IP manualmente.
      }
    };

    loadDefaultIp();
  }, []);

  const monthName = MONTHS.find((m) => m.value === month)?.label;

  const handleGenerate = async () => {
    const hostNormalized = host.trim();
    if (!isValidIPv4(hostNormalized)) {
      setError('Informe um IPv4 válido da máquina do colaborador (ex.: 192.168.1.25)');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = reportType === 'st'
        ? await generatePadariaSTReport({ emitente, month, year, host: hostNormalized })
        : await generatePadariaMonofasicoReport({ emitente, month, year, host: hostNormalized });

      if (res.data.success) {
        setResult(res.data);
      } else {
        setError(res.data.error || 'Erro ao gerar relatório');
      }
    } catch (e: any) {
      setError(e.message || 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const fileLabel = reportType === 'st' ? 'Padaria_ST' : 'Padaria_Monofasico';
    downloadBase64Excel(result, `${fileLabel}_${emitente}.xlsx`);
  };

  return (
    <div className="card overflow-hidden">
      <div
        className="px-6 py-5 flex items-start justify-between gap-4"
        style={{ borderBottom: '1px solid #222222', background: 'rgba(237,12,0,.04)' }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(237,12,0,.12)', border: '1px solid rgba(237,12,0,.2)' }}
          >
            <ClipboardList size={22} style={{ color: '#ed0c00' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{title}</h3>
              <span
                className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest"
                style={{ background: 'rgba(237,12,0,.1)', color: '#ed0c00', border: '1px solid rgba(237,12,0,.15)' }}
              >
                {badge}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: '#888888' }}>{description}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col gap-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={13} style={{ color: '#ed0c00' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#cccccc' }}>
              Mês de Competência
            </span>
          </div>
          <div className="flex gap-3">
            <select
              value={month}
              onChange={e => { setMonth(Number(e.target.value)); setResult(null); setError(null); }}
              className="field text-sm flex-1"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              min={2000}
              max={2099}
              onChange={e => { setYear(Number(e.target.value)); setResult(null); setError(null); }}
              className="field text-sm"
              style={{ width: 100 }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: '#555555' }}>
            Será gerado de 01/{String(month).padStart(2, '0')}/{year} até o último dia do mês
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database size={13} style={{ color: '#ed0c00' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#cccccc' }}>
              Emitente
            </span>
          </div>
          <select
            value={emitente}
            onChange={e => { setEmitente(e.target.value as PadariaEmitente); setResult(null); setError(null); }}
            className="field text-sm w-full"
          >
            {PADARIA_EMITENTES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <p className="text-xs mt-1.5" style={{ color: '#555555' }}>
            Empresa escolhida para a consulta no período {monthName}/{year}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database size={13} style={{ color: '#ed0c00' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#cccccc' }}>
              IP do Servidor
            </span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ex.: 192.168.1.25"
            value={host}
            onChange={e => { setHost(e.target.value); setResult(null); setError(null); }}
            className="field text-sm w-full"
          />
          <p className="text-xs mt-1.5" style={{ color: '#555555' }}>
            O relatório será consultado no banco <span className="font-mono">padariadoalemao</span> desse IP usando as credenciais do backend.
          </p>
        </div>

        {error && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg text-sm"
            style={{ background: 'rgba(239,68,68,.05)', border: '1px solid rgba(239,68,68,.2)' }}
          >
            <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
            <span style={{ color: '#fca5a5' }}>{error}</span>
          </div>
        )}

        {result && !loading && (
          <div
            className="p-4 rounded-lg flex items-start justify-between gap-4"
            style={{ background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.2)' }}
          >
            <div className="flex items-start gap-3">
              <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-semibold text-white">Relatório gerado com sucesso!</p>
                <p className="text-xs mt-0.5" style={{ color: '#86efac' }}>
                  <span className="font-bold">{result.totalRows}</span> registros — {emitente === 'A_C_COSTA' ? 'A.C Costa' : 'Brunetto'} ({monthName}/{year})
                </p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="btn btn-success flex-shrink-0"
              style={{ padding: '7px 14px' }}
            >
              <Download size={13} />
              Baixar
            </button>
          </div>
        )}

        {loading && (
          <div
            className="p-4 rounded-lg flex items-center gap-3"
            style={{ background: 'rgba(237,12,0,.05)', border: '1px solid rgba(237,12,0,.15)' }}
          >
            <Loader size={16} style={{ color: '#ed0c00' }} className="spin" />
            <div>
              <p className="text-sm font-medium text-white">Gerando relatório...</p>
              <p className="text-xs" style={{ color: '#888888' }}>Consultando banco padariadoalemao no IP informado</p>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn btn-primary w-full justify-center"
        >
          {loading
            ? <><Loader size={14} className="spin" /> Gerando...</>
            : <><Zap size={14} /> Gerar Relatório — {monthName}/{year}</>
          }
        </button>
      </div>
    </div>
  );
};

// ── ManualReports (main view) ──────────────────────────────────────────────────

const ManualReports: React.FC = () => {
  return (
    <div className="fade-up">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-1">
          <FileBarChart2 size={22} style={{ color: '#ed0c00' }} />
          <h2 className="text-xl font-bold text-white">Relatórios Manuais</h2>
        </div>
        <p className="text-sm" style={{ color: '#475569', paddingLeft: 34 }}>
          Relatórios gerados via SQL direto no banco de dados do cliente — exportação em Excel formatado
        </p>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl mb-6"
        style={{ background: 'rgba(255,255,255,.02)', border: '1px solid #222222' }}
      >
        <Database size={15} style={{ color: '#ed0c00', flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs" style={{ color: '#888888' }}>
          Estes relatórios se conectam diretamente ao banco de dados local, certifique-se de que o servidor MariaDB está acessível.
        </p>
      </div>

      {/* Reports section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <ChevronRight size={14} style={{ color: '#ed0c00' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#888888' }}>
            Clientes Disponíveis
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <FrigoReportCard />
          <PadariaReportCard
            title="Substituição Tributária"
            description="Consulta itens com CSOSN 500 no banco padariadoalemao."
            badge="PADARIA DO ALEMÃO"
            reportType="st"
          />
          <PadariaReportCard
            title="Incidência Monofásica"
            description="Consulta itens com incidência monofásica no banco padariadoalemao."
            badge="PADARIA DO ALEMÃO"
            reportType="monofasico"
          />
        </div>
      </div>
    </div>
  );
};

export default ManualReports;
