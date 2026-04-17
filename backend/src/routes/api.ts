import { Router } from 'express';
import pool from '../database/connection.js';
import { checkPort } from '../services/networkService.js';
import { fetchCNPJ } from '../services/cnpjService.js';
import type { PortResult } from '../models/types.js';

const router = Router();

// ─── GROUPS ──────────────────────────────────────────────────────────────────

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
  const ports = (
    typeof client.ports === 'string' ? client.ports.split(',') : client.ports
  )
    .map(Number)
    .filter(Boolean);

  if (!ports.length) {
    return { status: 'ERROR', results: [], last_test: new Date().toISOString() };
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

  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

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

export default router;
