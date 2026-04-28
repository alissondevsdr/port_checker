import type { Request, Response } from 'express';
import pool from '../database/connection.js';
import { handleError } from '../utils/errorHandler.js';

export class RemoteController {
  // --- Companies ---
  static async getAllCompanies(req: Request, res: Response) {
    try {
      const [rows] = await pool.query(`
        SELECT c.*, COUNT(conn.id) as connections_count
        FROM remote_companies c
        LEFT JOIN remote_connections conn ON conn.company_id = c.id
        GROUP BY c.id
        ORDER BY c.name ASC
      `);
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'Erro ao listar empresas remotas');
    }
  }

  static async createCompany(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });

      const [result]: any = await pool.query(
        'INSERT INTO remote_companies (name) VALUES (?)',
        [name.trim()]
      );
      res.json({ id: result.insertId, name: name.trim(), connections_count: 0 });
    } catch (error) {
      handleError(res, error, 'Erro ao criar empresa remota');
    }
  }

  static async updateCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });

      await pool.query(
        'UPDATE remote_companies SET name = ? WHERE id = ?',
        [name.trim(), id]
      );
      res.json({ success: true });
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar empresa remota');
    }
  }

  static async deleteCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM remote_companies WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      handleError(res, error, 'Erro ao excluir empresa remota');
    }
  }

  // --- Connections ---
  static async getConnections(req: Request, res: Response) {
    try {
      const { company_id } = req.query;
      let query = 'SELECT * FROM remote_connections';
      const params: any[] = [];

      if (company_id) {
        query += ' WHERE company_id = ?';
        params.push(company_id);
      }

      query += ' ORDER BY created_at DESC';
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'Erro ao listar conexões');
    }
  }

  static async createConnection(req: Request, res: Response) {
    try {
      const { company_id, connection_string, connection_type, connection_software } = req.body;

      if (!company_id || !connection_string || !connection_type || !connection_software) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }

      // Get company name
      const [companies]: any = await pool.query('SELECT name FROM remote_companies WHERE id = ?', [company_id]);
      if (companies.length === 0) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }
      const company_name = companies[0].name;

      const [result]: any = await pool.query(
        'INSERT INTO remote_connections (company_id, company_name, connection_string, connection_type, connection_software) VALUES (?, ?, ?, ?, ?)',
        [company_id, company_name, connection_string, connection_type, connection_software]
      );

      res.json({ 
        id: result.insertId, 
        company_id, 
        company_name, 
        connection_string, 
        connection_type, 
        connection_software 
      });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Esta conexão já está cadastrada' });
      }
      handleError(res, error, 'Erro ao criar conexão');
    }
  }

  static async updateConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { connection_string, connection_type, connection_software } = req.body;

      await pool.query(
        'UPDATE remote_connections SET connection_string = ?, connection_type = ?, connection_software = ? WHERE id = ?',
        [connection_string, connection_type, connection_software, id]
      );
      res.json({ success: true });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Esta conexão já está cadastrada' });
      }
      handleError(res, error, 'Erro ao atualizar conexão');
    }
  }

  static async deleteConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM remote_connections WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      handleError(res, error, 'Erro ao excluir conexão');
    }
  }
}
