import { z } from 'zod';

/** Configuración que necesita la app Express (se puede armar a mano en los tests). */
export interface AppConfig {
  jwtSecret: string;
  jwtTtlSeconds: number;
  bcryptCost: number;
  corsOrigins: string[];
  rateLimitEnabled: boolean;
  /** Cantidad de proxies de confianza delante de la API (0 si no hay ninguno). */
  trustProxyHops: number;
}

export interface ServerConfig extends AppConfig {
  port: number;
  mongoUri: string;
}

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().min(1, 'es obligatorio'),
  JWT_SECRET: z.string().min(32, 'debe tener al menos 32 caracteres'),
  JWT_TTL_SECONDS: z.coerce.number().int().min(60).default(604800),
  CORS_ORIGINS: z.string().optional().default(''),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
});

/** Lee y valida las variables de entorno. Falla al arrancar si falta algo importante. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuración inválida:\n${detail}`);
  }
  const e = parsed.data;
  return {
    port: e.PORT,
    mongoUri: e.MONGODB_URI,
    jwtSecret: e.JWT_SECRET,
    jwtTtlSeconds: e.JWT_TTL_SECONDS,
    bcryptCost: 12,
    corsOrigins: e.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    rateLimitEnabled: true,
    trustProxyHops: e.TRUST_PROXY,
  };
}
