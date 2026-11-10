import assert from 'node:assert/strict';
import test from 'node:test';
import { image, imageFrame, integer, productInput, slugInput, text } from '../src/commerce.js';

test('preços e estoques exigem inteiros dentro dos limites comerciais', () => {
  assert.equal(integer(1, 'Preço', 1), 1);
  assert.equal(integer(0, 'Estoque', 0, 1000000), 0);
  for (const value of [NaN, Infinity, -1, 1.5, '10', Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => integer(value, 'Estoque', 0, 1000000));
  assert.throws(() => integer(0, 'Preço', 1));
  assert.throws(() => integer(1000001, 'Estoque', 0, 1000000));
});

test('identificadores de loja não aceitam caminhos, espaços nem caracteres de URL', () => {
  assert.equal(slugInput('loja-01'), 'loja-01');
  for (const value of [
    '../admin',
    'loja/01',
    'loja?admin=1',
    'loja%2fadmin',
    ' loja',
    '1loja',
    'área',
    'a',
    'a'.repeat(51),
    null,
  ])
    assert.throws(() => slugInput(value));
});

test('textos preservam acentos e rejeitam entradas vazias ou maiores que o contrato', () => {
  assert.equal(text('  Construção  ', 'Nome', 10), 'Construção');
  for (const value of ['', '  ', 123, null, 'a'.repeat(11)])
    assert.throws(() => text(value, 'Nome', 10));
});

test('fotos aceitam HTTPS e formatos raster permitidos, com limite de tamanho', () => {
  assert.equal(image(undefined), '');
  assert.equal(image('https://example.test/foto.webp'), 'https://example.test/foto.webp');
  assert.equal(image('data:image/webp;base64,YQ=='), 'data:image/webp;base64,YQ==');
  assert.throws(() => image('', true));
  for (const value of [
    'http://example.test/foto.png',
    'javascript:alert(1)',
    'data:image/svg+xml;base64,YQ==',
    'https://example.test/ imagem.png',
    'data:image/png;base64,' + 'a'.repeat(2900000),
  ])
    assert.throws(() => image(value));
});

test('enquadramento impede zoom e posições inválidas, inclusive valores não finitos', () => {
  assert.deepEqual(imageFrame(undefined), { fit: 'contain', x: 50, y: 50, zoom: 1 });
  assert.deepEqual(imageFrame({ fit: 'cover', x: 0, y: 100, zoom: 3 }), {
    fit: 'cover',
    x: 0,
    y: 100,
    zoom: 3,
  });
  for (const override of [
    { fit: 'fill' },
    { x: -1 },
    { y: 101 },
    { zoom: 0.9 },
    { zoom: 3.1 },
    { x: NaN },
    { zoom: Infinity },
    { y: '50' },
  ])
    assert.throws(() => imageFrame({ fit: 'cover', x: 50, y: 50, zoom: 1, ...override }));
});

test('cadastro de produto não incorpora identidade, loja ou privilégios enviados pelo cliente', () => {
  const product = productInput({
    name: '  Peça  ',
    description: 'Teste',
    priceInCents: 1999,
    stock: 4,
    id: 'forjado',
    storeId: 'outra-loja',
    admin: true,
    imageSource: 'externa',
  });
  assert.equal(product.name, 'Peça');
  assert.equal(product.imageSource, 'owner');
  assert.equal(product.image, '');
  for (const key of ['id', 'storeId', 'admin']) assert.equal(key in product, false);
  assert.throws(() => productInput({ ...product, priceInCents: 0 }));
  assert.throws(() => productInput(null));
});
