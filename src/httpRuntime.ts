import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import {
  BOR_PRODUCT,
  BOR_RUNTIME_VERSION,
  getBorRuntimeStatus,
  type BorRuntimeStatus,
} from './runtime.js';

export interface BorHttpResponse {
  statusCode: number;
  body: Record<string, unknown>;
}

function json(res: ServerResponse, response: BorHttpResponse): void {
  res.statusCode = response.statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(response.body));
}

export function getBorHttpResponse(
  pathname: string,
  method: string,
  env: NodeJS.ProcessEnv = process.env,
  now: Date = new Date(),
): BorHttpResponse {
  if (method !== 'GET') {
    return {
      statusCode: 405,
      body: {
        ok: false,
        product: BOR_PRODUCT,
        version: BOR_RUNTIME_VERSION,
        error: 'METHOD_NOT_ALLOWED',
      },
    };
  }

  if (pathname === '/health') {
    const runtime = getBorRuntimeStatus(env, now);
    return {
      statusCode: runtime.status === 'READY' ? 200 : 503,
      body: {
        ok: runtime.status === 'READY',
        runtime,
      },
    };
  }

  if (pathname === '/version') {
    return {
      statusCode: 200,
      body: {
        ok: true,
        product: BOR_PRODUCT,
        version: BOR_RUNTIME_VERSION,
        tradingAuthority: false,
        botDependency: false,
      },
    };
  }

  return {
    statusCode: 404,
    body: {
      ok: false,
      product: BOR_PRODUCT,
      version: BOR_RUNTIME_VERSION,
      error: 'NOT_FOUND',
    },
  };
}

export function createBorHttpServer(env: NodeJS.ProcessEnv = process.env) {
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const method = req.method ?? 'GET';
    let pathname = '/';

    try {
      pathname = new URL(req.url ?? '/', 'http://bor.local').pathname;
    } catch {
      json(res, {
        statusCode: 400,
        body: {
          ok: false,
          product: BOR_PRODUCT,
          version: BOR_RUNTIME_VERSION,
          error: 'INVALID_URL',
        },
      });
      return;
    }

    json(res, getBorHttpResponse(pathname, method, env));
  });
}

export type { BorRuntimeStatus };
