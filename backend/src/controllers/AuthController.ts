import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/connection.js';
import { handleError } from '../utils/errorHandler.js';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: 'Usuário e senha são obrigatórios'
        });
      }

      const [rows]: any = await pool.query(
        'SELECT * FROM users WHERE username = ? LIMIT 1',
        [username]
      );

      const user = rows[0];

      if (!user) {
        return res.status(401).json({
          error: 'Credenciais inválidas'
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({
          error: 'Credenciais inválidas'
        });
      }

      const secret = process.env.JWT_SECRET;

      if (!secret || secret.trim() === '') {
        console.error('JWT_SECRET não configurado');

        return res.status(500).json({
          error: 'Erro interno de autenticação'
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username
        },
        secret,
        {
          expiresIn: '8h'
        }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error) {
      return handleError(res, error, 'Falha ao realizar login');
    }
  }

  static async me(req: Request, res: Response) {
    return res.json((req as any).user);
  }
}