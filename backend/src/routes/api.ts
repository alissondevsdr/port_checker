import { Router } from 'express';
import pool from '../database/connection.js';
import { checkPort } from '../services/networkService.js';
import { fetchCNPJ } from '../services/cnpjService.js';
import ExcelProcessor from '../services/excelCleaner.js';
import type { PortResult } from '../models/types.js';
import mysql from 'mysql2/promise';
import ExcelJS from 'exceljs';
import net from 'node:net';
import path from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const router = Router();
const routeDir = path.dirname(fileURLToPath(import.meta.url));
const downloadsDir = path.resolve(routeDir, '../../../downloads');

const toReadableSize = (sizeBytes: number) => {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = sizeBytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
};

// ─── GROUPS ──────────────────────────────────────────────────────────────────

router.get('/downloads', async (_req, res) => {
  try {
    const entries = await readdir(downloadsDir, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const fullPath = path.join(downloadsDir, entry.name);
          const stats = await stat(fullPath);
          return {
            name: entry.name.replace(/\.[^.]+$/, ''),
            filename: entry.name,
            size: toReadableSize(stats.size),
            sizeBytes: stats.size,
            modifiedAt: stats.mtime.toISOString(),
          };
        })
    );

    files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
    return res.json(files);
  } catch (error: any) {
    if (error?.code === 'ENOENT') return res.json([]);
    return res.status(500).json({ error: 'Falha ao listar arquivos de download' });
  }
});

router.get('/groups', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT g.*,
        COUNT(c.id)                          AS client_count,
        SUM(c.status = 'OK')                 AS ok_count,
        SUM(c.status = 'ERROR')              AS error_count,
        SUM(c.status = 'PENDING')            AS pending_count
      FROM \`groups\` g
      LEFT JOIN clients c ON c.group_id = g.id
      GROUP BY g.id
      ORDER BY g.name ASC
    `);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/groups', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
    const [result]: any = await pool.query(
      'INSERT INTO `groups` (name) VALUES (?)',
      [name.trim()]
    );
    res.json({ id: result.insertId, name: name.trim(), client_count: 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/groups/:id', async (req, res) => {
  try {
    await pool.query('UPDATE clients SET group_id = NULL WHERE group_id = ?', [req.params.id]);
    await pool.query('DELETE FROM `groups` WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

router.get('/clients', async (req, res) => {
  try {
    const groupId = req.query.group_id;
    let query = `
      SELECT c.*, g.name AS group_name
      FROM clients c
      LEFT JOIN \`groups\` g ON g.id = c.group_id
    `;
    const params: any[] = [];
    if (groupId) {
      query += ' WHERE c.group_id = ?';
      params.push(groupId);
    }
    query += ' ORDER BY c.name ASC';

    const [rows]: any = await pool.query(query, params);
    res.json(
      rows.map((c: any) => ({
        ...c,
        ports: typeof c.ports === 'string' ? c.ports.split(',').map(Number).filter(Boolean) : [],
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/clients', async (req, res) => {
  try {
    const { name, cnpj, phone, host, ports, group_id, ip_interno, provedor_internet } = req.body;
    if (!name?.trim() || !host?.trim())
      return res.status(400).json({ error: 'Nome e host são obrigatórios' });

    const portsStr = Array.isArray(ports) ? ports.join(',') : ports;
    const [result]: any = await pool.query(
      `INSERT INTO clients (name, cnpj, phone, host, ports, group_id, ip_interno, provedor_internet)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        cnpj || '',
        phone || '',
        host.trim(),
        portsStr,
        group_id || null,
        ip_interno || '',
        provedor_internet || '',
      ]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/clients/:id', async (req, res) => {
  try {
    const { name, cnpj, phone, host, ports, group_id, ip_interno, provedor_internet } = req.body;
    const portsStr = Array.isArray(ports) ? ports.join(',') : ports;
    await pool.query(
      `UPDATE clients
       SET name=?, cnpj=?, phone=?, host=?, ports=?, group_id=?, ip_interno=?, provedor_internet=?
       WHERE id=?`,
      [name, cnpj, phone || '', host, portsStr, group_id || null, ip_interno || '', provedor_internet || '', req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/clients/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── TEST ENGINE ─────────────────────────────────────────────────────────────

async function performTest(client: any) {
  const toLocalSqlDateTime = (date: Date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 19).replace('T', ' ');
  };

  const ports = (
    typeof client.ports === 'string' ? client.ports.split(',') : client.ports
  )
    .map(Number)
    .filter(Boolean);

  if (!ports.length) {
    return { status: 'ERROR', results: [], last_test: toLocalSqlDateTime(new Date()) };
  }

  const results: PortResult[] = await Promise.all(
    ports.map((port: number) => checkPort(client.host, port))
  );

  const openPorts = results.filter(r => r.open);
  const avgResponse =
    openPorts.length > 0
      ? openPorts.reduce((acc, r) => acc + (r.response_time || 0), 0) / openPorts.length
      : null;

  let status = 'ERROR';
  if (openPorts.length === results.length) status = 'OK';

  const timestamp = toLocalSqlDateTime(new Date());

  await pool.query(
    'UPDATE clients SET status=?, last_test=?, avg_response_ms=? WHERE id=?',
    [status, timestamp, avgResponse, client.id]
  );

  const [logResult]: any = await pool.query(
    `INSERT INTO test_logs (client_id, client_name, timestamp, status, duration_ms, details)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [client.id, client.name, timestamp, status, avgResponse || 0, JSON.stringify(results)]
  );

  const logId = logResult.insertId;
  for (const r of results) {
    await pool.query(
      'INSERT INTO port_results (log_id, port, is_open, response_ms, error) VALUES (?, ?, ?, ?, ?)',
      [logId, r.port, r.open ? 1 : 0, r.response_time ?? null, r.error ?? null]
    );
  }

  return { status, results, last_test: timestamp, avg_response_ms: avgResponse };
}

// IMPORTANT: test-all and group test MUST come BEFORE /:id/test
router.post('/clients/test-all', async (req, res) => {
  try {
    const [clients]: any = await pool.query('SELECT * FROM clients');
    const results = [];
    for (const client of clients) {
      const result = await performTest(client);
      results.push({ id: client.id, name: client.name, ...result });
    }
    res.json({ success: true, count: clients.length, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/clients/:id/test', async (req, res) => {
  try {
    const [clients]: any = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!clients[0]) return res.status(404).json({ error: 'Cliente não encontrado' });
    const result = await performTest(clients[0]);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test all clients in a specific group
router.post('/groups/:id/test', async (req, res) => {
  try {
    const [clients]: any = await pool.query('SELECT * FROM clients WHERE group_id = ?', [req.params.id]);
    if (!clients.length) return res.json({ success: true, count: 0, results: [] });

    const results = [];
    for (const client of clients) {
      const result = await performTest(client);
      results.push({ id: client.id, name: client.name, ...result });
    }
    res.json({ success: true, count: clients.length, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── CNPJ ────────────────────────────────────────────────────────────────────

router.get('/cnpj/:cnpj', async (req, res) => {
  try {
    const data = await fetchCNPJ(req.params.cnpj);
    res.json({
      razao_social: data.razao_social || data.nome_fantasia || 'Empresa não identificada',
      nome_fantasia: data.nome_fantasia || '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      bairro: data.bairro || '',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── REMOTE CONNECTIONS ──────────────────────────────────────────────────────

// ─── REMOTE COMPANIES ────────────────────────────────────────────────────────

router.get('/remote-companies', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, COUNT(conn.id) as connections_count 
      FROM remote_companies c
      LEFT JOIN remote_connections conn ON c.id = conn.company_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/remote-companies', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Nome da empresa é obrigatório' });
    }

    const [existing]: any = await pool.query('SELECT id FROM remote_companies WHERE name = ?', [name.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Uma empresa com este nome já está cadastrada' });
    }

    const [result]: any = await pool.query('INSERT INTO remote_companies (name) VALUES (?)', [name.trim()]);
    res.json({ id: result.insertId, name: name.trim() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/remote-companies/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Nome da empresa é obrigatório' });
    }

    const [existing]: any = await pool.query('SELECT id FROM remote_companies WHERE name = ? AND id != ?', [name.trim(), req.params.id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Uma empresa com este nome já está cadastrada' });
    }

    await pool.query('UPDATE remote_companies SET name = ? WHERE id = ?', [name.trim(), req.params.id]);
    // Also update company_name in connections for denormalization/legacy support
    await pool.query('UPDATE remote_connections SET company_name = ? WHERE company_id = ?', [name.trim(), req.params.id]);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/remote-companies/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM remote_companies WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── REMOTE CONNECTIONS ──────────────────────────────────────────────────────

router.get('/remote-connections', async (req, res) => {
  try {
    const { company_id } = req.query;
    let query = 'SELECT * FROM remote_connections';
    let params: any[] = [];

    if (company_id) {
      query += ' WHERE company_id = ?';
      params.push(company_id);
    }

    query += ' ORDER BY company_name ASC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/remote-connections', async (req, res) => {
  try {
    const { company_id, company_name, connection_string, connection_software, connection_type } = req.body;
    
    if (!company_id || !connection_string?.trim() || !connection_type?.trim() || !connection_software?.trim()) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Get company name if not provided or ensure it's valid
    let final_company_name = company_name;
    const [comp]: any = await pool.query('SELECT name FROM remote_companies WHERE id = ?', [company_id]);
    
    if (comp.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    
    final_company_name = comp[0].name;

    // Verificar se a connection_string já existe
    const [existing]: any = await pool.query(
      'SELECT id FROM remote_connections WHERE connection_string = ?',
      [connection_string.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Esta string de conexão já está cadastrada' });
    }

    const [result]: any = await pool.query(
      `INSERT INTO remote_connections (company_id, company_name, connection_string, connection_type, connection_software)
       VALUES (?, ?, ?, ?, ?)`,
      [company_id, final_company_name, connection_string.trim(), connection_type.trim(), connection_software.trim()]
    );
    
    res.json({ 
      id: result.insertId, 
      company_id: Number(company_id), 
      company_name: final_company_name, 
      connection_string: connection_string.trim(), 
      connection_type: connection_type.trim(), 
      connection_software: connection_software.trim() 
    });
  } catch (error: any) {
    console.error('Erro ao criar conexão remota:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao salvar conexão' });
  }
});

router.put('/remote-connections/:id', async (req, res) => {
  try {
    const { connection_string, connection_type, connection_software } = req.body;
    if (!connection_string?.trim() || !connection_type?.trim() || !connection_software?.trim()) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Verificar se a connection_string já existe para outro ID
    const [existing]: any = await pool.query(
      'SELECT id FROM remote_connections WHERE connection_string = ? AND id != ?',
      [connection_string.trim(), req.params.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Esta string de conexão já está cadastrada em outra empresa' });
    }

    await pool.query(
      `UPDATE remote_connections
       SET connection_string=?, connection_type=?, connection_software=?
       WHERE id=?`,
      [connection_string.trim(), connection_type.trim(), connection_software.trim(), req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/remote-connections/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM remote_connections WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── EXCEL PROCESSOR ──────────────────────────────────────────────────────────

// Rota para processar arquivo Excel desorganizado
router.post('/excel/process', async (req, res) => {
  try {
    if (!req.body || !req.body.file) {
      return res.status(400).json({ error: 'Nenhum arquivo fornecido' });
    }

    // Converter buffer base64 para Buffer
    const buffer = Buffer.from(req.body.file, 'base64');
    const mode = req.body.mode || 'simples';

    // Processar arquivo
    const result = await ExcelProcessor.processSpreadsheet(buffer, mode);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Retornar arquivo processado como base64
    res.json({
      success: true,
      message: result.message,
      totalRows: result.totalRows,
      processedRows: result.processedRows,
      invalidRows: result.invalidRows,
      file: result.buffer?.toString('base64'),
    });
  } catch (error: any) {
    console.error('Erro ao processar Excel:', error);
    res.status(500).json({
      success: false,
      message: `Erro ao processar arquivo: ${error.message}`,
      totalRows: 0,
      processedRows: 0,
      invalidRows: 0,
    });
  }
});

// Rota para download do template padrão
router.get('/excel/template', async (req, res) => {
  try {
    const mode = (req.query.mode as string) || 'simples';
    const buffer = await ExcelProcessor.generateTemplateExcel(mode as 'simples' | 'normal');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template_padrao.xlsx"');
    res.send(buffer);
  } catch (error: any) {
    console.error('Erro ao gerar template:', error);
    res.status(500).json({ error: 'Erro ao gerar template' });
  }
});

async function generateFrigoExcel(rows: any[], month: number, year: number): Promise<Buffer> {
  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const monthName = MONTH_NAMES[month - 1];
 
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ferramentas de Suporte';
  workbook.created = new Date();
 
  const ws = workbook.addWorksheet('Ordens de Serviço', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
 
  const colDefs = [
    { header: 'Nº OS',      key: 'NUMERO',   width: 10 },
    { header: 'Situação',   key: 'SITUACAO',  width: 13 },
    { header: 'Placa',      key: 'PLACA',     width: 11 },
    { header: 'Cliente',    key: 'CLIENTE',   width: 36 },
    { header: 'Fantasia',   key: 'FANTASIA',  width: 26 },
    { header: 'CNPJ',       key: 'CNPJ',      width: 18 },
    { header: 'Depto',      key: 'DEPTO',     width: 14 },
    { header: 'Data',       key: 'DATA',      width: 12 },
    { header: 'Valor (R$)', key: 'VALOR',     width: 14 },
    { header: 'Ano',        key: 'ANO',       width: 8  },
    { header: 'KM',         key: 'KM',        width: 10 },
    { header: 'Marca',      key: 'MARCA',     width: 14 },
    { header: 'Modelo',     key: 'MODELO',    width: 18 },
    { header: 'Cor',        key: 'COR',       width: 12 },
  ];
 
  colDefs.forEach((def, i) => { ws.getColumn(i + 1).width = def.width; });
 
  // Linha de título
  ws.mergeCells(1, 1, 1, colDefs.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `RELATÓRIO DE ORDENS DE SERVIÇO — ${monthName.toUpperCase()} / ${year}`;
  titleCell.font      = { bold: true, size: 13, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
  titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0A00' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;
 
  // Subtítulo
  ws.mergeCells(2, 1, 2, colDefs.length);
  const subCell = ws.getCell(2, 1);
  subCell.value = `Gerado em ${new Date().toLocaleString('pt-BR')}   •   Total de registros: ${rows.length}`;
  subCell.font      = { italic: true, size: 9, color: { argb: 'FF888888' }, name: 'Calibri' };
  subCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
  subCell.alignment = { horizontal: 'right', vertical: 'middle' };
  ws.getRow(2).height = 16;
 
  // Linha em branco
  ws.addRow([]);
  ws.getRow(3).height = 6;
 
  // Cabeçalho das colunas
  const headerRow = ws.addRow(colDefs.map(c => c.header));
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font      = { bold: true, size: 9, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F1F1F' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border    = {
      bottom: { style: 'medium', color: { argb: 'FFCC0A00' } },
      right:  { style: 'thin',   color: { argb: 'FF333333' } },
    };
  });
 
  // Cores por situação
  const situacaoColor: Record<string, string> = {
    'ENCERRADO': '22c55e',
    'CANCELADO': 'ef4444',
    'PENDENTE':  'f59e0b',
  };
 
  // Linhas de dados
  rows.forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? 'FF111111' : 'FF161616';
    const dataRow = ws.addRow([
      row.NUMERO, row.SITUACAO, row.PLACA, row.CLIENTE, row.FANTASIA,
      row.CNPJ, row.DEPTO, row.DATA, row.VALOR, row.ANO,
      row.KM, row.MARCA, row.MODELO, row.COR,
    ]);
    dataRow.height = 18;
 
    dataRow.eachCell((cell, colNumber) => {
      const key = colDefs[colNumber - 1]?.key;
      cell.font      = { size: 9, color: { argb: 'FFD0D0D0' }, name: 'Calibri' };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border    = {
        bottom: { style: 'thin', color: { argb: 'FF222222' } },
        right:  { style: 'thin', color: { argb: 'FF333333' } },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
 
      if (key === 'CLIENTE' || key === 'FANTASIA' || key === 'MODELO') {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
      if (key === 'VALOR') {
        cell.numFmt    = 'R$ #,##0.00';
        cell.font      = { ...cell.font, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
      if (key === 'NUMERO') {
        cell.font = { ...cell.font, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Courier New' };
      }
      if (key === 'PLACA') {
        cell.font = { ...cell.font, bold: true, color: { argb: 'FFFFCC00' }, name: 'Courier New' };
      }
      if (key === 'SITUACAO') {
        const cor = situacaoColor[String(cell.value)];
        if (cor) cell.font = { ...cell.font, bold: true, color: { argb: `FF${cor}` } };
      }
      if (key === 'CNPJ') {
        cell.font = { ...cell.font, name: 'Courier New', size: 8 };
      }
    });
  });
 
  // Rodapé com total
  const totalRow = ws.addRow(Array(colDefs.length).fill(''));
  const valorColIdx = colDefs.findIndex(c => c.key === 'VALOR') + 1;
  const totalCell = totalRow.getCell(valorColIdx);
  totalCell.value  = rows.reduce((acc, r) => acc + (parseFloat(r.VALOR) || 0), 0);
  totalCell.numFmt = 'R$ #,##0.00';
  totalCell.font   = { bold: true, size: 10, color: { argb: 'FF22c55e' }, name: 'Calibri' };
 
  const labelCell = totalRow.getCell(valorColIdx - 1);
  labelCell.value     = 'TOTAL:';
  labelCell.font      = { bold: true, size: 9, color: { argb: 'FFaaaaaa' }, name: 'Calibri' };
  labelCell.alignment = { horizontal: 'right', vertical: 'middle' };
 
  totalRow.eachCell(cell => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D0D0D' } };
    cell.border = { top: { style: 'medium', color: { argb: 'FFCC0A00' } } };
  });
  totalRow.height = 22;
 
  ws.views = [{ state: 'frozen', ySplit: 4, activeCell: 'A5' }];
 
  const buffer = await (workbook.xlsx as any).writeBuffer();
  return buffer as Buffer;
}

async function generateSimpleExcel(rows: any[], title: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ferramentas de Suporte';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Relatório', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const colCount = Math.max(columns.length, 1);

  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0A00' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 24;

  ws.mergeCells(2, 1, 2, colCount);
  const metaCell = ws.getCell(2, 1);
  metaCell.value = `Gerado em ${new Date().toLocaleString('pt-BR')}   •   Total de registros: ${rows.length}`;
  metaCell.font = { italic: true, size: 9, color: { argb: 'FF888888' }, name: 'Calibri' };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
  metaCell.alignment = { horizontal: 'right', vertical: 'middle' };
  ws.getRow(2).height = 16;

  ws.addRow([]);
  ws.getRow(3).height = 6;

  if (columns.length > 0) {
    const headerRow = ws.addRow(columns);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F1F1F' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FFCC0A00' } },
        right: { style: 'thin', color: { argb: 'FF333333' } },
      };
    });

    rows.forEach((row, idx) => {
      const bgColor = idx % 2 === 0 ? 'FF111111' : 'FF161616';
      const dataRow = ws.addRow(columns.map((col) => row[col]));
      dataRow.height = 18;

      dataRow.eachCell((cell) => {
        cell.font = { size: 9, color: { argb: 'FFD0D0D0' }, name: 'Calibri' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FF222222' } },
          right: { style: 'thin', color: { argb: 'FF333333' } },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
    });

    columns.forEach((col, i) => {
      const size = Math.max(
        col.length,
        ...rows.map((row) => String(row[col] ?? '').length)
      );
      ws.getColumn(i + 1).width = Math.min(45, Math.max(12, size + 2));
    });
  } else {
    const emptyRow = ws.addRow(['Nenhum registro encontrado']);
    emptyRow.eachCell((cell) => {
      cell.font = { size: 10, color: { argb: 'FFD0D0D0' }, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } };
    });
    ws.getColumn(1).width = 32;
  }

  ws.views = [{ state: 'frozen', ySplit: 4, activeCell: 'A5' }];
  const buffer = await (workbook.xlsx as any).writeBuffer();
  return buffer as Buffer;
}

function extractRequestIPv4(req: any): string | null {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(xForwardedFor)
    ? xForwardedFor[0]
    : typeof xForwardedFor === 'string'
      ? xForwardedFor.split(',')[0]
      : '';

  const candidates = [forwardedIp, req.socket?.remoteAddress, req.ip]
    .filter(Boolean)
    .map((v: string) => String(v).trim());

  for (const candidate of candidates) {
    const normalized = candidate.startsWith('::ffff:') ? candidate.replace('::ffff:', '') : candidate;
    if (net.isIP(normalized) === 4) return normalized;
  }

  return null;
}

router.get('/reports/client-ip', (req, res) => {
  const ipv4 = extractRequestIPv4(req);
  if (!ipv4) return res.status(404).json({ success: false, error: 'IPv4 do cliente não identificado' });
  return res.json({ success: true, ip: ipv4 });
});

type PadariaReportType = 'st' | 'monofasico';

const PADARIA_EMITENTES: Record<string, { id: number; label: string }> = {
  BRUNETTO: { id: 1, label: 'Brunetto' },
  A_C_COSTA: { id: 2, label: 'A.C Costa' },
};

const PADARIA_REPORTS: Record<PadariaReportType, { title: string; query: string; filenamePrefix: string }> = {
  st: {
    title: 'Relatório Produtos ST',
    filenamePrefix: 'Padaria_ST',
    query: `SELECT
      n.NFC_NUMERO AS NUMERO,
      pr.PRO_DESCRICAO AS DESCRICAO,
      i.ITE_CFOP AS CFOP,
      i.ITE_NCM AS NCM,
      i.ITE_QTDE AS QUANTIDADE,
      i.ITE_UNITARIO AS UNITARIO,
      i.ITE_TOTAL AS TOTAL,
      n.NFC_DATAEMISSAO AS DATA
    FROM ITENSNFCE i
    JOIN NFCE n ON n.NFC_CODIGO = i.COD_NFCE
    JOIN PRODUTOS pr ON pr.PRO_CODIGO = i.COD_PRODUTO
    WHERE i.ITE_CSOSN = '500'
      AND n.NFC_SITUACAO = 3
      AND n.NFC_DATAEMISSAO BETWEEN ? AND ?
      AND n.NFC_EMITENTE = ?
    ORDER BY n.NFC_NUMERO`,
  },
  monofasico: {
    title: 'Relatório Produtos Monofásicos',
    filenamePrefix: 'Padaria_Monofasico',
    query: `SELECT
      n.NFC_NUMERO AS NUMERO,
      pr.PRO_DESCRICAO AS DESCRICAO,
      i.ITE_CFOP AS CFOP,
      i.ITE_NCM AS NCM,
      i.ITE_QTDE AS QUANTIDADE,
      i.ITE_UNITARIO AS UNITARIO,
      i.ITE_TOTAL AS TOTAL
    FROM ITENSNFCE i
    JOIN NFCE n ON n.NFC_CODIGO = i.COD_NFCE
    JOIN PRODUTOS pr ON pr.PRO_CODIGO = i.COD_PRODUTO
    JOIN ncmpiscofins ncmp ON ncmp.NCM_CODIGO = pr.PRO_NCM
    WHERE n.NFC_SITUACAO = 3
      AND ncmp.NCM_PISCOFINS = 0
      AND n.NFC_DATAEMISSAO BETWEEN ? AND ?
      AND n.NFC_EMITENTE = ?
    ORDER BY n.NFC_NUMERO`,
  },
};

async function handlePadariaReport(req: any, res: any, reportType: PadariaReportType) {
  let padariaPool: mysql.Pool | null = null;
  try {
    const { emitente, month, year, host } = req.body;
    const emitenteKey = String(emitente || '').toUpperCase().replace(/\./g, '').replace(/\s+/g, '_');
    const emitenteInfo = PADARIA_EMITENTES[emitenteKey];
    const m = parseInt(String(month));
    const y = parseInt(String(year));
    const padariaHost = String(host || '').trim();

    if (!month || !year || !host) {
      return res.status(400).json({ success: false, error: 'Mês, ano e IP são obrigatórios' });
    }

    if (!emitenteInfo) {
      return res.status(400).json({ success: false, error: 'Emitente inválido. Use Brunetto ou A.C Costa' });
    }
    if (isNaN(m) || m < 1 || m > 12)
      return res.status(400).json({ success: false, error: 'Mês inválido (1-12)' });
    if (isNaN(y) || y < 2000 || y > 2099)
      return res.status(400).json({ success: false, error: 'Ano inválido' });
    if (net.isIP(padariaHost) !== 4)
      return res.status(400).json({ success: false, error: 'IP inválido. Informe um IPv4 válido' });

    const reportConfig = PADARIA_REPORTS[reportType];
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;

    padariaPool = mysql.createPool({
      host: padariaHost,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'padariadoalemao',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 3,
      connectTimeout: parseInt(process.env.PADARIA_CONNECT_TIMEOUT_MS || '7000'),
      queueLimit: 0,
    });

    const [rows]: any = await padariaPool.query(reportConfig.query, [startDate, endDate, emitenteInfo.id]);

    if (!rows?.length) {
      return res.status(404).json({
        success: false,
        error: `Nenhum registro encontrado para ${emitenteInfo.label} no período selecionado`,
      });
    }

    const reportTitle = `${reportConfig.title} - ${emitenteInfo.label} (${String(m).padStart(2, '0')}/${y})`;
    const buffer = await generateSimpleExcel(rows, reportTitle);

    return res.json({
      success: true,
      totalRows: rows.length,
      file: (buffer as any).toString('base64'),
      filename: `${reportConfig.filenamePrefix}_${emitenteInfo.label.replace(/\s+/g, '_')}_${y}${String(m).padStart(2, '0')}.xlsx`,
      period: { startDate, endDate },
    });
  } catch (error: any) {
    console.error('Erro no relatório Padaria:', error);
    const msg =
      error.code === 'ER_BAD_DB_ERROR' ? 'Banco de dados "padariadoalemao" não encontrado' :
      error.code === 'ER_PARSE_ERROR' ? 'Falha ao executar a query do relatório' :
      error.code === 'ECONNREFUSED' ? 'Conexão recusada — verifique se o MySQL está rodando na máquina informada' :
      error.code === 'ETIMEDOUT' ? 'Tempo de conexão esgotado ao acessar o banco padariadoalemao no IP informado' :
      error.code === 'ENETUNREACH' || error.code === 'EHOSTUNREACH'
        ? 'Host inacessível na rede local. Verifique IP, firewall e conectividade'
        :
      error.code === 'ER_ACCESS_DENIED_ERROR' ? 'Acesso negado — verifique usuário/senha no .env' :
      error.message || 'Erro interno';

    return res.status(500).json({ success: false, error: msg });
  } finally {
    if (padariaPool) {
      try { await padariaPool.end(); } catch {}
    }
  }
}

router.post('/reports/padaria/st', async (req, res) => handlePadariaReport(req, res, 'st'));
router.post('/reports/padaria/monofasico', async (req, res) => handlePadariaReport(req, res, 'monofasico'));
 
// ─── Rota POST /api/reports/frigo ────────────────────────────────────────────
 
router.post('/reports/frigo', async (req, res) => {
  let frigoPool: mysql.Pool | null = null;
 
  try {
    const { month, year, host } = req.body;
 
    if (!month || !year || !host) {
      return res.status(400).json({ success: false, error: 'Mês, ano e IP são obrigatórios' });
    }
 
    const m = parseInt(String(month));
    const y = parseInt(String(year));
    const frigoHost = String(host).trim();
 
    if (isNaN(m) || m < 1 || m > 12)
      return res.status(400).json({ success: false, error: 'Mês inválido (1-12)' });
    if (isNaN(y) || y < 2000 || y > 2099)
      return res.status(400).json({ success: false, error: 'Ano inválido' });
    if (net.isIP(frigoHost) !== 4)
      return res.status(400).json({ success: false, error: 'IP inválido. Informe um IPv4 válido' });
 
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay   = new Date(y, m, 0).getDate();
    const endDate   = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
 
    frigoPool = mysql.createPool({
      host:               frigoHost,
      user:               process.env.DB_USER     || 'root',
      password:           process.env.DB_PASSWORD || '',
      database:           'frigo',
      port:               parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit:    3,
      connectTimeout:     parseInt(process.env.FRIGO_CONNECT_TIMEOUT_MS || '7000'),
      queueLimit:         0,
    });
 
    const [rows]: any = await frigoPool.query(
      `SELECT DAV_NUMERO AS NUMERO,
        IF(DAV_SITUACAO=2, 'CANCELADO', IF(DAV_SITUACAO=1, 'ENCERRADO', 'PENDENTE')) AS SITUACAO,
        DAV_PLACA    AS PLACA,
        CLI_NOME     AS CLIENTE,
        CLI_FANTASIA AS FANTASIA,
        CLI_DOC1     AS CNPJ,
        DEP_DESCRICAO AS DEPTO,
        DATE_FORMAT(IF(DAV_SITUACAO=0, DAV_DATAINICIO, DAV_DATAFINAL), '%d/%m/%Y') AS DATA,
        DAV_SALDO  AS VALOR,
        DAV_ANO    AS ANO,
        DAV_KM     AS KM,
        DAV_MARCA  AS MARCA,
        DAV_MODELO AS MODELO,
        DAV_COR    AS COR
      FROM DAVCOMOS, CLIENTES, DEPTOS
      WHERE (DAVCOMOS.COD_CLIENTE = CLIENTES.CLI_CODIGO)
        AND (DAVCOMOS.COD_DEPTO   = DEPTOS.DEP_CODIGO)
        AND (IF(DAV_SITUACAO=0, DAV_DATAINICIO, DAV_DATAFINAL) BETWEEN ? AND ?)
      ORDER BY PLACA`,
      [startDate, endDate]
    );
 
    const buffer = await generateFrigoExcel(rows, m, y);
 
    res.json({
      success:   true,
      totalRows: rows.length,
      file:      (buffer as any).toString('base64'),
      filename:  `OS_Frigo_${String(m).padStart(2, '0')}_${y}.xlsx`,
    });
 
  } catch (error: any) {
    console.error('Erro no relatório Frigo:', error);
    const msg =
      error.code === 'ER_BAD_DB_ERROR'    ? 'Banco de dados "frigo" não encontrado na máquina informada' :
      error.code === 'ECONNREFUSED'        ? 'Conexão recusada — verifique se o MySQL está rodando na máquina informada' :
      error.code === 'ETIMEDOUT'           ? 'Tempo de conexão esgotado ao acessar o MySQL no IP informado' :
      error.code === 'ENETUNREACH' || error.code === 'EHOSTUNREACH'
        ? 'Host inacessível na rede local. Verifique IP, firewall e conectividade'
        :
      error.code === 'ER_ACCESS_DENIED_ERROR' ? 'Acesso negado — verifique usuário/senha no .env' :
      error.message || 'Erro interno';
 
    res.status(500).json({ success: false, error: msg });
  } finally {
    if (frigoPool) {
      try { await frigoPool.end(); } catch {}
    }
  }
});

export default router;
