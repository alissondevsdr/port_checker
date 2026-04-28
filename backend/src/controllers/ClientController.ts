import type { Request, Response } from 'express';
import pool from '../database/connection.js';
import { checkPort } from '../services/networkService.js';
import { handleError } from '../utils/errorHandler.js';
import type { PortResult } from '../models/types.js';
import pLimit from 'p-limit';

const limit = pLimit(5); // Limita a 5 testes simultâneos para evitar sobrecarga (BUG-001)

export class ClientController {
  static async getAll(req: Request, res: Response) {
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
    } catch (error) {
      handleError(res, error, 'Erro ao listar clientes');
    }
  }

  static async create(req: Request, res: Response) {
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
    } catch (error) {
      handleError(res, error, 'Erro ao criar cliente');
    }
  }

  static async update(req: Request, res: Response) {
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
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar cliente');
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      handleError(res, error, 'Erro ao excluir cliente');
    }
  }

  static async testSingle(req: Request, res: Response) {
    try {
      const [clients]: any = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
      if (!clients[0]) return res.status(404).json({ error: 'Cliente não encontrado' });
      const result = await ClientController.performTest(clients[0]);
      res.json(result);
    } catch (error) {
      handleError(res, error, 'Erro ao testar cliente');
    }
  }

  static async testAll(req: Request, res: Response) {
    try {
      const [clients]: any = await pool.query('SELECT * FROM clients');
      
      // Execução controlada com p-limit para evitar timeout e sobrecarga (BUG-001)
      const results = await Promise.all(
        clients.map((client: any) => 
          limit(async () => {
            const result = await ClientController.performTest(client);
            return { id: client.id, name: client.name, ...result };
          })
        )
      );
      
      res.json({ success: true, count: clients.length, results });
    } catch (error) {
      handleError(res, error, 'Erro ao testar todos os clientes');
    }
  }

  static async performTest(client: any) {
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
}
