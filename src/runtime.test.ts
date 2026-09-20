import assert from 'node:assert/strict';
import test from 'node:test';

import { findForbiddenTradingEnvironment, getBorRuntimeStatus } from './runtime.js';

test('BOR runtime is independently ready without BOT or broker configuration', () => {
  const status = getBorRuntimeStatus(
    { NODE_ENV: 'test' },
    new Date('2026-09-21T00:00:00.000Z'),
  );

  assert.equal(status.status, 'READY');
  assert.equal(status.tradingAuthority, false);
  assert.equal(status.botDependency, false);
  assert.deepEqual(status.blockers, []);
});

test('broker or trading secret names fail closed without exposing values', () => {
  const env = {
    UPBIT_ACCESS_KEY: 'must-never-be-returned',
    BROKER_SECRET: 'must-never-be-returned',
  };

  assert.deepEqual(findForbiddenTradingEnvironment(env), [
    'BROKER_SECRET',
    'UPBIT_ACCESS_KEY',
  ]);

  const status = getBorRuntimeStatus(env, new Date('2026-09-21T00:00:00.000Z'));
  assert.equal(status.status, 'BLOCKED');
  assert.ok(status.blockers.every((blocker) => !blocker.includes('must-never-be-returned')));
});

test('invalid runtime clock fails closed', () => {
  const status = getBorRuntimeStatus({}, new Date('invalid'));
  assert.equal(status.status, 'BLOCKED');
  assert.deepEqual(status.blockers, ['INVALID_RUNTIME_CLOCK']);
  assert.equal(status.checkedAt, 'INVALID');
});
