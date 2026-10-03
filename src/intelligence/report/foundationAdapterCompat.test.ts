import assert from 'node:assert/strict';
import test from 'node:test';
import { BOR_ALPHA_READ_MODEL_SCHEMA_VERSION } from '../../foundation/legacyFoundationAdapters.js';
import { ALPHA_READ_MODEL_SCHEMA_VERSION } from './alphaReadModel.js';

// foundation may not import intelligence, so the adapter keeps its own copy
// of the read model schema version. Keep the two in lockstep.
test('foundation adapter reads the same alpha read model schema the report layer writes', () => {
  assert.equal(BOR_ALPHA_READ_MODEL_SCHEMA_VERSION, ALPHA_READ_MODEL_SCHEMA_VERSION);
});
