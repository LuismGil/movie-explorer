import type { Request, Response, NextFunction } from 'express';
import { env } from '@mcp/config/env.js';

export function validateOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  
  if (!origin) {
    next();
    return;
  }

  if (!env.MCP_ALLOWED_ORIGINS || env.MCP_ALLOWED_ORIGINS.length === 0) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  
  if (!env.MCP_ALLOWED_ORIGINS.includes(origin)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
}
