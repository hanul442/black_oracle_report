import assert from 'node:assert/strict';
import test from 'node:test';
import { NarsAssetResolver, normalizeIssuerName } from './narsAssetResolver.js';

const SK_HYNIX = { status: 'RESOLVED', canonicalAssetId: 'KRX:000660', symbol: '000660' };

test('SK하이닉스 aliases resolve to KRX:000660', () => {
  const resolver = new NarsAssetResolver();
  for (const name of ['SK하이닉스', 'sk하이닉스', 'SK 하이닉스', '에스케이하이닉스(주)', '㈜에스케이하이닉스', 'SK hynix', 'SK Hynix Inc.', 'ＳＫ하이닉스']) {
    assert.deepEqual(resolver.resolve(name, 'title'), SK_HYNIX, name);
  }
});

test('near misses and other issuers stay unresolved', () => {
  const resolver = new NarsAssetResolver();
  for (const name of ['SK', 'SK스퀘어', 'SK하이닉스우', '하이닉스', 'SK하이닉스반도체', '삼성전자']) {
    assert.deepEqual(resolver.resolve(name, 'title'), { status: 'UNRESOLVED', query: name, reason: 'NARS_ISSUER_NOT_IN_SKELETON' }, name);
  }
  assert.deepEqual(resolver.resolve(null, '(유가증권)SK하이닉스 - 공시'), { status: 'UNRESOLVED', query: '(유가증권)SK하이닉스 - 공시', reason: 'NARS_NO_ISSUER_ENTITY' });
});

test('an alias claimed by two assets is rejected', () => {
  assert.throws(() => new NarsAssetResolver([
    { canonicalAssetId: 'KRX:000660', symbol: '000660', aliases: ['SK하이닉스'] },
    { canonicalAssetId: 'KRX:999999', symbol: '999999', aliases: ['sk 하이닉스'] },
  ]), /AMBIGUOUS_ASSET_ALIAS/);
  assert.equal(normalizeIssuerName(' 주식회사 SK-하이닉스 '), 'sk하이닉스');
});
