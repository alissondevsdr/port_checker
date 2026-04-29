import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../database/connection.js';
import { handleError } from '../utils/errorHandler.js';

export class UserController {
  static async getAll(req: Request, res: Response) {
    try {
      const currentUser = (req as any).user;
      if (currentUser?.role !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const [rows]: any = await pool.query(
        'SELECT id, username, role, created_at FROM users ORDER BY username ASC'
      );
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'Erro ao listar usuários');
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const currentUser = (req as any).user;
      if (currentUser?.role !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { username, password, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
      }

      // Verificar se já existe
      const [existing]: any = await pool.query(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Este nome de usuário já está em uso' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [result]: any = await pool.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, role || 'COLABORADOR']
      );

      res.status(201).json({
        id: result.insertId,
        username,
        role: role || 'COLABORADOR',
        message: 'Usuário criado com sucesso'
      });
    } catch (error) {
      handleError(res, error, 'Erro ao criar usuário');
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const currentUser = (req as any).user;
      if (currentUser?.role !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { id } = req.params;
      const { username, password, role } = req.body;

      if (!username) {
        return res.status(400).json({ error: 'O nome de usuário é obrigatório' });
      }

      // Verificar duplicidade de username ignorando o próprio ID
      const [existing]: any = await pool.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Este nome de usuário já está em uso' });
      }

      let query = 'UPDATE users SET username = ?, role = ?';
      const params: any[] = [username, role || 'COLABORADOR'];

      if (password && password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += ', password = ?';
        params.push(hashedPassword);
      }

      query += ' WHERE id = ?';
      params.push(id);

      await pool.query(query, params);

      res.json({ success: true, message: 'Usuário atualizado com sucesso' });
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar usuário');
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;

      if (currentUser?.role !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      if (currentUser && currentUser.id === parseInt(id as string)) {
        return res.status(400).json({ error: 'Você não pode excluir o seu próprio usuário' });
      }

      // Verificar se existem atendimentos vinculados
      const [atendimentos]: any = await pool.query(
        'SELECT id FROM atendimentos WHERE atendente_id = ? LIMIT 1',
        [id]
      );

      if (atendimentos.length > 0) {
        return res.status(400).json({ 
          error: 'Não é possível excluir este usuário pois ele possui atendimentos vinculados.' 
        });
      }

      await pool.query('DELETE FROM users WHERE id = ?', [id]);
      res.json({ success: true, message: 'Usuário excluído com sucesso' });
    } catch (error) {
      handleError(res, error, 'Erro ao excluir usuário');
    }
  }
}
