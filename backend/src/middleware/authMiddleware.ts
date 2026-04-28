import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Token mal formatado' });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim() === '') {
    console.error('JWT_SECRET não configurado');
    return res.status(500).json({ error: 'Erro interno de autenticação' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    return next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'TOKEN_EXPIRED', 
        message: 'Sessão expirada. Por favor, faça login novamente.' 
      });
    }
    return res.status(401).json({ 
      error: 'TOKEN_INVALID', 
      message: 'Token inválido ou malformado.' 
    });
  }
};
