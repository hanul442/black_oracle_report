import assert from 'node:assert/strict';
import test from 'node:test';

import { getBorHttpResponse } from './httpRuntime.js';

const NOW = new Date('2026-09-21T04:30:00.000Z');

test('health is ready without BOT or broker configuration', () => {
  const response = getBorHttpResponse('/health', 'GET', { NODE_ENV: 'test' }, NOW);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  const runtime = response.body.runtime as {
    status: string;
    tradingAuthority: boolean;
    botDependency: boolean;
    blockers: string[];
  };
  assert.equal(runtime.status, 'READY');
  assert.equal(runtime.tradingAuthority, false);
  assert.equal(runtime.botDependency, false);
  assert.deepEqual(runtime.blockers, []);
});

test('health fails closed on forbidden trading environment names without exposing values', () => {
  const response = getBorHttpResponse('/health', 'GET', {
    NODE_ENV: 'production',
    UPBIT_ACCESS_KEY: 'super-secret-never-return',
    BROKER_SECRET: 'another-secret-never-return',
  }, NOW);

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.ok, false);
  const serialized = JSON.stringify(response.body);
  assert.doesNotMatch(serialized, /super-secret-never-return/);
  assert.doesNotMatch(serialized, /another-secret-never-return/);
  assert.match(serialized, /FORBIDDEN_TRADING_ENV/);
});

test('version surface is authority-free and stable', () => {
  const response = getBorHttpResponse('/version', 'GET', {}, NOW);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.tradingAuthority, false);
  assert.equal(response.body.botDependency, false);
  assert.equal(typeof response.body.version, 'string');
});

test('non-GET and unknown routes are explicit', () => {
  assert.equal(getBorHttpResponse('/health', 'POST', {}, NOW).statusCode, 405);
  assert.equal(getBorHttpResponse('/unknown', 'GET', {}, NOW).statusCode, 404);
});
