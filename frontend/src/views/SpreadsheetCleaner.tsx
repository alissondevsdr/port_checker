import React, { useState, useRef } from 'react';
import { Upload, Download, Zap, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { processExcelFile, downloadTemplateExcel } from '../services/api';

const SpreadsheetCleaner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [mode, setMode] = useState<'simples' | 'normal'>('simples');

  const handleFileSelect = (selectedFile: File | null) => {
    setError(null);
    setResult(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validar tipo de arquivo
    if (!['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(selectedFile.type)) {
      setError('❌ Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
      setFile(null);
      return;
    }

    // Validar tamanho (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('❌ Arquivo muito grande. Máximo: 10MB');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleProcessFile = async () => {
    if (!file) {
      setError('❌ Selecione um arquivo primeiro');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const result = await processExcelFile(new Uint8Array(buffer), mode);

      if (result.data.success) {
        setResult(result.data);
      } else {
        setError(`❌ ${result.data.message}`);
      }
    } catch (err: any) {
      setError(`❌ Erro: ${err.message || 'Falha ao processar arquivo'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadProcessed = () => {
    if (!result?.file) return;

    const binaryString = atob(result.file);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produtos_formatado_${mode}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await downloadTemplateExcel(mode);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_produtos_${mode}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError('❌ Erro ao baixar template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap size={28} className="text-red-500" />
          <h1 className="text-3xl font-bold text-white">Formatador de Planilhas</h1>
        </div>
        <p className="text-gray-400 text-base">
          Envie uma planilha com produtos desorganizada e gere automaticamente uma versão padronizada e organizada.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seção de Upload e Processamento */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seleção de Modo */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Tipo de Tributação</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="simples"
                  checked={mode === 'simples'}
                  onChange={(e) => setMode(e.target.value as 'simples' | 'normal')}
                  className="text-red-500 focus:ring-red-500"
                />
                <span className="text-gray-300">SIMPLES NACIONAL</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="normal"
                  checked={mode === 'normal'}
                  onChange={(e) => setMode(e.target.value as 'simples' | 'normal')}
                  className="text-red-500 focus:ring-red-500"
                />
                <span className="text-gray-300">NORMAL</span>
              </label>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {mode === 'simples' 
                ? '10 colunas: Código, Cód.Barra, Referência, NCM, Descrição, CSOSN, Class., CEST, IPPT, Sit. Trib. do ECF'
                : '24 colunas: Código, Cód. Barra, Referência, NCM, Descrição + 19 colunas de impostos (CST, ICMS, IPI, PIS, COFINS, etc.)'
              }
            </p>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="card p-8 cursor-pointer transition-all hover:border-red-500/50"
            style={{
              borderWidth: '2px',
              borderStyle: 'dashed',
              borderColor: file ? '#ed0c00' : '#333333',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            />

            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-lg" style={{ background: 'rgba(237,12,0,.1)' }}>
                <Upload size={32} className="text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Clique ou arraste seu arquivo aqui</p>
                <p className="text-gray-400 text-sm">Formatos aceitos: .xlsx, .xls (máx. 10MB)</p>
              </div>
            </div>
          </div>

          {/* Arquivo Selecionado */}
          {file && (
            <div className="card p-4 flex items-center justify-between" style={{ background: 'rgba(34,197,94,.05)', borderColor: 'rgba(34,197,94,.2)' }}>
              <div className="flex items-center gap-3 flex-1">
                <CheckCircle size={20} className="text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                onClick={() => handleFileSelect(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="card p-4 flex items-start gap-3" style={{ background: 'rgba(239,68,68,.05)', borderColor: 'rgba(239,68,68,.2)' }}>
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-200">{error}</p>
              </div>
            </div>
          )}

          {/* Barra de Progresso */}
          {loading && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Loader size={20} className="text-red-500 animate-spin" />
                <p className="text-white font-medium">Processando sua planilha...</p>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ background: '#1a1a2a' }}
              >
                <div
                  className="h-full w-1/3"
                  style={{
                    background: '#ed0c00',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                ></div>
              </div>
              <p className="text-gray-400 text-sm">Removendo colunas desnecessárias, reordenando e formatando...</p>
            </div>
          )}

          {/* Resultado */}
          {result && !loading && (
            <div className="space-y-4">
              <div className="card p-6 space-y-4" style={{ background: 'rgba(34,197,94,.05)', borderColor: 'rgba(34,197,94,.2)' }}>
                <div className="flex items-start gap-3">
                  <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white font-semibold text-lg">✅ {result.message}</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p className="text-gray-300">
                        <span className="text-green-400 font-semibold">{result.processedRows}</span> linhas válidas processadas
                      </p>
                      {result.invalidRows > 0 && (
                        <p className="text-gray-300">
                          <span className="text-yellow-400 font-semibold">{result.invalidRows}</span> linhas removidas (sem código)
                        </p>
                      )}
                      <p className="text-gray-400 text-xs mt-2">
                        Total original: {result.totalRows} linhas
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadProcessed}
                className="btn btn-success w-full flex items-center justify-center gap-2"
              >
                <Download size={16} />
                ⬇ Baixar Planilha Formatada
              </button>
            </div>
          )}

          {/* Botão de Processamento */}
          {file && !result && (
            <button
              onClick={handleProcessFile}
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              Processar Arquivo
            </button>
          )}

          {result && (
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
                setError(null);
              }}
              className="btn btn-ghost w-full"
            >
              ↺ Enviar Outro Arquivo
            </button>
          )}
        </div>

        {/* Sidebar - Informações e Download do Template */}
        <div className="space-y-6">
          {/* Card de Informações */}
          <div className="card p-6 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Zap size={18} className="text-red-500" />
              Como Funciona
            </h3>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex gap-3">
                <div className="font-bold text-red-500 flex-shrink-0">1.</div>
                <p>Envie sua planilha com produtos</p>
              </div>
              <div className="flex gap-3">
                <div className="font-bold text-red-500 flex-shrink-0">2.</div>
                <p>Remove colunas desnecessárias</p>
              </div>
              <div className="flex gap-3">
                <div className="font-bold text-red-500 flex-shrink-0">3.</div>
                <p>Reordena as {mode === 'simples' ? '10' : '24'} colunas corretas</p>
              </div>
              <div className="flex gap-3">
                <div className="font-bold text-red-500 flex-shrink-0">4.</div>
                <p>Baixe a planilha formatada pronta</p>
              </div>
            </div>
          </div>

          {/* Card de Download de Template */}
          <div className="card p-6 space-y-4">
            <h3 className="text-white font-semibold">📎 Template Padrão</h3>
            <p className="text-gray-400 text-sm">
              {mode === 'simples' 
                ? 'Baixe o arquivo modelo com a estrutura correta de 10 colunas (SIMPLES NACIONAL).'
                : 'Baixe o arquivo modelo com a estrutura correta de 24 colunas (NORMAL com impostos).'}
            </p>
            <button
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="btn btn-ghost w-full justify-center"
            >
              <Download size={16} />
              {downloadingTemplate ? 'Baixando...' : `Download Template ${mode.toUpperCase()}`}
            </button>
          </div>

          {/* Card de Colunas */}
          <div className="card p-6 space-y-3">
            <h3 className="text-white font-semibold text-sm">📊 Colunas Processadas ({mode === 'simples' ? '10' : '24'})</h3>
            <ul className="space-y-2 text-xs text-gray-400 max-h-64 overflow-y-auto">
              {mode === 'simples' ? (
                <>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>Código</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>Cód.Barra</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>Referência</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>NCM</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>Descrição</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>CSOSN</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>Class.</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>CEST</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>IPPT</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>Sit. Trib. do ECF</span></li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>Código</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>Cód. Barra</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>Referência</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>NCM</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500">✓</span><span>Descrição</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>CST</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>Class. Quanto à Origem</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>CEST</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>IPPT</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>Tipo SPED</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>% ICMS</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>Modalidade determinação BC ICMS</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>% IPI</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>IPI Entrada</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>IPI Saída</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>% PIS</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>PIS Entrada</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>PIS Saída</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>% COFINS</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>COFINS Entrada</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>COFINS Saída</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>% ICMS ST</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>Modalidade de determinação BC ICMS ST</span></li>
                  <li className="flex items-start gap-2"><span className="text-yellow-500">★</span><span>MVA %</span></li>
                </>
              )}
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              {mode === 'simples' ? '✓ Colunas de Produto' : '✓ Colunas de Produto  •  ★ Colunas de Imposto'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetCleaner;
