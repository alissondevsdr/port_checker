import type { Request, Response } from 'express';
import pool from '../database/connection.js';
import { ClientController } from './ClientController.js';
import { handleError } from '../utils/errorHandler.js';
import pLimit from 'p-limit';

const limit = pLimit(5);

export class GroupController {
  static async getAll(req: Request, res: Response) {
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
    } catch (error) {
      handleError(res, error, 'Erro ao listar grupos');
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
      const [result]: any = await pool.query(
        'INSERT INTO `groups` (name) VALUES (?)',
        [name.trim()]
      );
      res.json({ id: result.insertId, name: name.trim(), client_count: 0 });
    } catch (error) {
      handleError(res, error, 'Erro ao criar grupo');
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await pool.query('UPDATE clients SET group_id = NULL WHERE group_id = ?', [req.params.id]);
      await pool.query('DELETE FROM `groups` WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      handleError(res, error, 'Erro ao excluir grupo');
    }
  }

  static async testGroup(req: Request, res: Response) {
    try {
      const [clients]: any = await pool.query('SELECT * FROM clients WHERE group_id = ?', [req.params.id]);
      if (!clients.length) return res.json({ success: true, count: 0, results: [] });

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
      handleError(res, error, 'Erro ao testar grupo');
    }
  }
}
