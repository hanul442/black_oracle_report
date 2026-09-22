import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { getAlphaReadApiResponse } from './alphaReadApi.js';
import { renderAlphaReportPage } from './alphaReportPage.js';
import type { AlphaReadModel } from './alphaReadModel.js';
import {
  BOR_PRODUCT,
  BOR_RUNTIME_VERSION,
  getBorRuntimeStatus,
  type BorRuntimeStatus,
} from './runtime.js';

export interface BorHttpResponse {
  statusCode: number;
  body: Record<string, unknown>;
  contentType?: string;
  rawBody?: string;
}

export type AlphaReadModelResolver = () => Readonly<AlphaReadModel> | undefined;

function send(res: ServerResponse, response: BorHttpResponse): void {
  res.statusCode = response.statusCode;
  res.setHeader('content-type', response.contentType ?? 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(response.rawBody ?? JSON.stringify(response.body));
}

export function getBorHttpResponse(
  pathname: string,
  method: string,
  env: NodeJS.ProcessEnv = process.env,
  now: Date = new Date(),
  resolveAlphaReadModel?: AlphaReadModelResolver,
): BorHttpResponse {
  if (pathname === '/alpha/report') {
    const apiResponse = getAlphaReadApiResponse(
      method,
      method === 'GET' ? resolveAlphaReadModel?.() : undefined,
    );
    const page = renderAlphaReportPage(apiResponse);
    return {
      statusCode: page.statusCode,
      body: apiResponse.body as Record<string, unknown>,
      contentType: page.contentType,
      rawBody: page.body,
    };
  }

  if (pathname === '/api/alpha/report') {
    const response = getAlphaReadApiResponse(
      method,
      method === 'GET' ? resolveAlphaReadModel?.() : undefined,
    );
    return { statusCode: response.statusCode, body: response.body as Record<string, unknown> };
  }

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

export function createBorHttpServer(
  env: NodeJS.ProcessEnv = process.env,
  resolveAlphaReadModel?: AlphaReadModelResolver,
) {
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const method = req.method ?? 'GET';
    let pathname = '/';

    try {
      pathname = new URL(req.url ?? '/', 'http://bor.local').pathname;
    } catch {
      send(res, {
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

    send(res, getBorHttpResponse(pathname, method, env, new Date(), resolveAlphaReadModel));
  });
}

export type { BorRuntimeStatus };
