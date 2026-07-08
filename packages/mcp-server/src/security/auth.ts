import type { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { env } from '@mcp/config/env.js';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.substring(7);
  const expectedKey = env.MCP_INTERNAL_API_KEY;
  
  const expectedBuffer = Buffer.from(expectedKey);
  const tokenBuffer = Buffer.from(token);
  
  if (expectedBuffer.length !== tokenBuffer.length) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  if (!timingSafeEqual(expectedBuffer, tokenBuffer)) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
