import type { Request, Response } from 'express';

/**
 * Encapsula erros para evitar vazamento de informações sensíveis (SEC-003)
 */
export const handleError = (res: Response, error: any, customMessage?: string) => {
  console.error('❌ Error details:', error);
  
  const status = error.status || 500;
  const message = customMessage || 'Erro interno do servidor';
  
  // Em desenvolvimento, podemos enviar mais detalhes se necessário, 
  // mas em produção evitamos expor stack traces ou mensagens do DB.
  return res.status(status).json({ 
    success: false,
    error: message,
    // message: process.env.NODE_ENV === 'development' ? error.message : undefined 
  });
};
