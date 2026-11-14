import type { Ai, D1Database, R2Bucket } from '@cloudflare/workers-types';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { HTTPException } from 'hono/http-exception';
import { z, ZodError, type ZodType } from 'zod';

/**
 * Variáveis de ambiente e bindings configurados no Cloudflare Pages.
 */
export interface Env {
  /**
   * Binding DB (Cloudflare D1 - SQLite serverless):
   * Armazena de forma relacional os usuários (`users`), lançamentos (`expenses`),
   * tetos mensais (`budgets`), regras de categorização (`merchant_rules`),
   * controle de tentativas de login (`login_attempts`) e cota diária de IA (`ai_usage`).
   */
  DB: D1Database;

  /**
   * Binding BUCKET (Cloudflare R2 - Object Storage):
   * Armazena arquivos binários de comprovantes/recibos enviados pelos usuários.
   * Os objetos são referenciados na tabela `expenses` via `image_key` e deduplicados via `image_hash`.
   */
  BUCKET: R2Bucket;

  /**
   * Binding AI (Cloudflare Workers AI):
   * Executa inferência diretamente na edge (extração estruturada de recibos/textos e
   * sugestão de categorias) sem expor nenhuma chave externa no cliente.
   */
  AI: Ai;

  /**
   * Segredo criptográfico usado para assinar e verificar tokens JWT/sessão em cookies HttpOnly.
   */
  JWT_SECRET: string;

  /**
   * Controla a abertura de novos cadastros públicos ("true" | "false").
   */
  ALLOW_SIGNUP: string;

  /**
   * Código de convite opcional validado durante o cadastro quando `ALLOW_SIGNUP` estiver restrito.
   */
  INVITE_CODE?: string;

  /**
   * Limite diário máximo (string numérica) de requisições de IA por usuário,
   * contabilizado na tabela `ai_usage`.
   */
  AI_DAILY_LIMIT_PER_USER?: string;
}

const app = new Hono<{ Bindings: Env }>().basePath('/api');

/**
 * Middleware global de cabeçalhos de segurança HTTP.
 */
const securityHeadersMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (
  c,
  next
) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
};

app.use('*', securityHeadersMiddleware);

/**
 * Tratamento global de erros em JSON padronizado: { error: string }.
 */
app.onError((err, c) => {
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const field = firstIssue?.path?.length ? `${firstIssue.path.join('.')}: ` : '';
    return c.json(
      { error: `Dados inválidos (${field}${firstIssue?.message ?? 'verifique os campos'}).` },
      400
    );
  }

  if (err instanceof HTTPException) {
    return c.json({ error: err.message || 'Erro na requisição.' }, err.status);
  }

  console.error('[API Error]', err);
  return c.json({ error: 'Erro interno do servidor.' }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Endpoint não encontrado.' }, 404);
});

/**
 * Helpers de validação com Zod reutilizáveis em todas as rotas.
 */
function parseWithSchema<T>(schema: ZodType<T>, raw: unknown): T {
  return schema.parse(raw);
}

async function parseJsonBody<T>(
  c: Context<{ Bindings: Env }>,
  schema: ZodType<T>
): Promise<T> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new HTTPException(400, {
      message: 'Corpo da requisição deve ser um JSON válido.',
    });
  }
  return parseWithSchema(schema, body);
}

/**
 * Schemas Zod das rotas base.
 */
const healthQuerySchema = z.object({}).strict();

/**
 * GET /api/health
 * Verifica disponibilidade da API na edge.
 */
app.get('/health', (c) => {
  parseWithSchema(healthQuerySchema, c.req.query());
  return c.json({ ok: true });
});

// Exportação exigida para consumo nas próximas rotas conforme evolução da API.
export { parseJsonBody, parseWithSchema };

export const onRequest = handle(app);
