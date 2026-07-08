import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  TMDB_API_KEY: z.string().trim().min(1),
  MCP_INTERNAL_API_KEY: z.string().min(32),
  MCP_HOST: z.string().default('127.0.0.1'),
  MCP_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  MCP_ALLOWED_ORIGINS: z.string().optional().superRefine((str, ctx) => {
    if (!str) return;
    str.split(',').forEach((s) => {
      try {
        const url = new URL(s.trim());
        if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid origin: must not contain path, query, fragment, or credentials',
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid URL format',
        });
      }
    });
  }).transform((str) => {
    if (!str) return [];
    return str.split(',').map((s) => new URL(s.trim()).origin);
  }),
});

export type Env = z.infer<typeof envSchema>;

export function getParsedEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch {
    // Return a generic startup error, do not print invalid values
    // eslint-disable-next-line no-console
    console.error('Invalid configuration.');
    process.exit(1);
  }
}

export const env = Object.freeze(getParsedEnv());
