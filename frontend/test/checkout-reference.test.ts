import test from 'node:test';
import assert from 'node:assert/strict';
import { randomFillSync } from 'node:crypto';
import { checkoutReference } from '../src/app/checkout-reference';

test('referência de checkout usa o UUID nativo quando disponível', () => {
  assert.equal(
    checkoutReference({
      randomUUID: () => 'uuid-nativo',
      getRandomValues: () => {
        throw new Error('Não deveria usar fallback');
      },
    }),
    'uuid-nativo',
  );
});

test('checkout em HTTP gera UUID v4 sem depender de randomUUID', () => {
  const source = { getRandomValues: (bytes: Uint8Array<ArrayBuffer>) => randomFillSync(bytes) };
  const references = new Set(Array.from({ length: 256 }, () => checkoutReference(source)));
  assert.equal(references.size, 256);
  for (const reference of references)
    assert.match(
      reference,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
});
