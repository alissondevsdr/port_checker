import { Router } from 'express';
import pool from '../database/connection.js';
import { checkPort } from '../services/networkService.js';
import { fetchCNPJ } from '../services/cnpjService.js';
import ExcelProcessor from '../services/excelCleaner.js';
import path from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const router = Router();
const routeDir = path.dirname(fileURLToPath(import.meta.url));
const downloadsDir = path.resolve(routeDir, '../../../downloads');
const toReadableSize = (sizeBytes) => {
    if (sizeBytes < 1024)
        return `${sizeBytes} B`;
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
        const files = await Promise.all(entries
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
        }));
        files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
        return res.json(files);
    }
    catch (error) {
        if (error?.code === 'ENOENT')
            return res.json([]);
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/groups', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome é obrigatório' });
        const [result] = await pool.query('INSERT INTO `groups` (name) VALUES (?)', [name.trim()]);
        res.json({ id: result.insertId, name: name.trim(), client_count: 0 });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/groups/:id', async (req, res) => {
    try {
        await pool.query('UPDATE clients SET group_id = NULL WHERE group_id = ?', [req.params.id]);
        await pool.query('DELETE FROM `groups` WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    }
    catch (error) {
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
        const params = [];
        if (groupId) {
            query += ' WHERE c.group_id = ?';
            params.push(groupId);
        }
        query += ' ORDER BY c.name ASC';
        const [rows] = await pool.query(query, params);
        res.json(rows.map((c) => ({
            ...c,
            ports: typeof c.ports === 'string' ? c.ports.split(',').map(Number).filter(Boolean) : [],
        })));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/clients', async (req, res) => {
    try {
        const { name, cnpj, phone, host, ports, group_id, ip_interno, provedor_internet } = req.body;
        if (!name?.trim() || !host?.trim())
            return res.status(400).json({ error: 'Nome e host são obrigatórios' });
        const portsStr = Array.isArray(ports) ? ports.join(',') : ports;
        const [result] = await pool.query(`INSERT INTO clients (name, cnpj, phone, host, ports, group_id, ip_interno, provedor_internet)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            name.trim(),
            cnpj || '',
            phone || '',
            host.trim(),
            portsStr,
            group_id || null,
            ip_interno || '',
            provedor_internet || '',
        ]);
        res.json({ id: result.insertId, ...req.body });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/clients/:id', async (req, res) => {
    try {
        const { name, cnpj, phone, host, ports, group_id, ip_interno, provedor_internet } = req.body;
        const portsStr = Array.isArray(ports) ? ports.join(',') : ports;
        await pool.query(`UPDATE clients
       SET name=?, cnpj=?, phone=?, host=?, ports=?, group_id=?, ip_interno=?, provedor_internet=?
       WHERE id=?`, [name, cnpj, phone || '', host, portsStr, group_id || null, ip_interno || '', provedor_internet || '', req.params.id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/clients/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── TEST ENGINE ─────────────────────────────────────────────────────────────
async function performTest(client) {
    const toLocalSqlDateTime = (date) => {
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 19).replace('T', ' ');
    };
    const ports = (typeof client.ports === 'string' ? client.ports.split(',') : client.ports)
        .map(Number)
        .filter(Boolean);
    if (!ports.length) {
        return { status: 'ERROR', results: [], last_test: toLocalSqlDateTime(new Date()) };
    }
    const results = await Promise.all(ports.map((port) => checkPort(client.host, port)));
    const openPorts = results.filter(r => r.open);
    const avgResponse = openPorts.length > 0
        ? openPorts.reduce((acc, r) => acc + (r.response_time || 0), 0) / openPorts.length
        : null;
    let status = 'ERROR';
    if (openPorts.length === results.length)
        status = 'OK';
    const timestamp = toLocalSqlDateTime(new Date());
    await pool.query('UPDATE clients SET status=?, last_test=?, avg_response_ms=? WHERE id=?', [status, timestamp, avgResponse, client.id]);
    const [logResult] = await pool.query(`INSERT INTO test_logs (client_id, client_name, timestamp, status, duration_ms, details)
     VALUES (?, ?, ?, ?, ?, ?)`, [client.id, client.name, timestamp, status, avgResponse || 0, JSON.stringify(results)]);
    const logId = logResult.insertId;
    for (const r of results) {
        await pool.query('INSERT INTO port_results (log_id, port, is_open, response_ms, error) VALUES (?, ?, ?, ?, ?)', [logId, r.port, r.open ? 1 : 0, r.response_time ?? null, r.error ?? null]);
    }
    return { status, results, last_test: timestamp, avg_response_ms: avgResponse };
}
// IMPORTANT: test-all and group test MUST come BEFORE /:id/test
router.post('/clients/test-all', async (req, res) => {
    try {
        const [clients] = await pool.query('SELECT * FROM clients');
        const results = [];
        for (const client of clients) {
            const result = await performTest(client);
            results.push({ id: client.id, name: client.name, ...result });
        }
        res.json({ success: true, count: clients.length, results });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/clients/:id/test', async (req, res) => {
    try {
        const [clients] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
        if (!clients[0])
            return res.status(404).json({ error: 'Cliente não encontrado' });
        const result = await performTest(clients[0]);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Test all clients in a specific group
router.post('/groups/:id/test', async (req, res) => {
    try {
        const [clients] = await pool.query('SELECT * FROM clients WHERE group_id = ?', [req.params.id]);
        if (!clients.length)
            return res.json({ success: true, count: 0, results: [] });
        const results = [];
        for (const client of clients) {
            const result = await performTest(client);
            results.push({ id: client.id, name: client.name, ...result });
        }
        res.json({ success: true, count: clients.length, results });
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// ─── REMOTE CONNECTIONS ──────────────────────────────────────────────────────
router.get('/remote-connections', async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT * FROM remote_connections
      ORDER BY company_name ASC
    `);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/remote-connections', async (req, res) => {
    try {
        const { company_name, connection_string ,connection_software, connection_type } = req.body;
        if (!company_name?.trim() || !connection_string?.trim() || !connection_software?.trim() || !connection_type?.trim()) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        const [result] = await pool.query(`INSERT INTO remote_connections (company_name, connection_string, connection_software, connection_type)
       VALUES (?, ?, ?, ?)`, [company_name.trim(), connection_string.trim(), connection_software.trim(), connection_type.trim()]);
        res.json({ id: result.insertId, company_name, connection_string, connection_software, connection_type });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/remote-connections/:id', async (req, res) => {
    try {
        const { company_name, connection_string, connection_type, connection_software } = req.body;
        if (!company_name?.trim() || !connection_string?.trim() || !connection_type?.trim() || !connection_software?.trim()) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        await pool.query(`UPDATE remote_connections
       SET company_name=?, connection_string=?, connection_type=?, connection_software=?
       WHERE id=?`, [company_name.trim(), connection_string.trim(), connection_type.trim(), connection_software.trim(), req.params.id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/remote-connections/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM remote_connections WHERE id=?', [req.params.id]);
        res.json({ success: true });
    }
    catch (error) {
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
    }
    catch (error) {
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
        const mode = req.query.mode || 'simples';
        const buffer = await ExcelProcessor.generateTemplateExcel(mode);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="template_padrao.xlsx"');
        res.send(buffer);
    }
    catch (error) {
        console.error('Erro ao gerar template:', error);
        res.status(500).json({ error: 'Erro ao gerar template' });
    }
});
export default router;
//# sourceMappingURL=api.js.map