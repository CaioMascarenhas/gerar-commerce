import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AssistedStore,
  CommerceApplication,
  ComponentRegistry,
  deriveProduct,
  EssentialStore,
  hasFeature,
  PickupShipping,
  validateConfiguration,
  composeStore,
  calculatePlan,
  normalizeSlug,
  quoteCheckout,
  SimulatedPayment,
} from '../src/index.js';
import type { ProductConfiguration } from '@gerar/contracts';

test('duas aplicações reutilizam o mesmo core e adaptam entrega e IA', () => {
  const essential = new EssentialStore().build();
  const assisted = new AssistedStore().build();
  assert.equal(essential.shippingInCents, 0);
  assert.equal(assisted.shippingInCents, 1500);
  assert.deepEqual(
    essential.components,
    assisted.components.filter((component) => component.feature !== 'aiAssistant'),
  );
  assert.equal(hasFeature(essential, 'aiAssistant'), false);
  assert.equal(hasFeature(assisted, 'aiAssistant'), true);
});

test('lojas dinâmicas mantêm o core e calculam preço pela seleção de opcionais', () => {
  assert.equal(calculatePlan([]).monthlyInCents, 5990);
  assert.equal(calculatePlan(['reviews', 'delivery']).monthlyInCents, 7990);
  assert.equal(calculatePlan(['aiAssistant']).monthlyInCents, 9990);
  assert.equal(calculatePlan(['reviews', 'aiAssistant', 'delivery']).monthlyInCents, 9990);
  const store = composeStore({
    slug: 'minha-loja',
    name: 'Minha loja',
    category: 'roupas',
    options: ['reviews', 'delivery'],
  });
  assert.equal(store.shippingInCents, 1500);
  assert(store.configuration.features.includes('cart'));
  assert(
    store.components.some(
      (component) => component.id === 'reviews' && component.service === 'catalog',
    ),
  );
  assert.equal(store.theme.accent, '#a33265');
});

test('categorias e opções não reconhecidas são rejeitadas e nomes têm slug normalizado', () => {
  assert.equal(normalizeSlug('Construção & Ação'), 'construcao-acao');
  assert.throws(
    () => composeStore({ slug: 'loja', name: 'Loja', category: 'invalida' as never, options: [] }),
    /Categoria/,
  );
  assert.throws(
    () =>
      composeStore({
        slug: 'loja',
        name: 'Loja',
        category: 'roupas',
        options: ['reviews', 'reviews'],
      }),
    /duplicados/,
  );
  assert.throws(
    () =>
      composeStore({
        slug: 'loja',
        name: 'Loja',
        category: 'roupas',
        options: ['catalog'] as never,
      }),
    /opcionais/,
  );
});

test('checkout aplica os componentes selecionados e rejeita opcionais ausentes', () => {
  const essential = composeStore({
    slug: 'minha-loja',
    name: 'Minha loja',
    category: 'roupas',
    options: [],
  });
  const complete = composeStore({
    slug: 'minha-loja',
    name: 'Minha loja',
    category: 'roupas',
    options: ['coupons', 'delivery'],
  });
  assert.equal(quoteCheckout(complete, 10000, 'BOASVINDAS10', 'delivery').totalInCents, 10500);
  assert.equal(quoteCheckout(essential, 10000, '', 'pickup').totalInCents, 10000);
  assert.throws(() => quoteCheckout(essential, 10000, 'BOASVINDAS10', 'pickup'), /Cupom/);
  assert.throws(() => quoteCheckout(essential, 10000, '', 'delivery'), /retirada/);
  assert.equal(new SimulatedPayment().authorize('declined'), 'declined');
});

test('configuração que remove recomendação obrigatória é rejeitada', () => {
  const configuration = structuredClone(deriveProduct('essencial').configuration);
  configuration.features = configuration.features.filter(
    (feature) => feature !== 'recommendations',
  );
  assert.throws(() => validateConfiguration(configuration), /recommendations/);
});

test('perfil e features desconhecidos não geram um produto aparentemente válido', () => {
  assert.throws(() => deriveProduct('../invalido'), /Perfil desconhecido/);
  const configuration = structuredClone(deriveProduct('essencial').configuration);
  configuration.features.push('desconhecida' as never);
  assert.throws(() => validateConfiguration(configuration), /desconhecida/);
});

test('Template Method rejeita uma extensão selecionada que não registra componente', () => {
  class BrokenStore extends CommerceApplication {
    protected configure(): ProductConfiguration {
      return deriveProduct('assistida').configuration;
    }
    protected shippingPolicy() {
      return new PickupShipping();
    }
  }
  assert.throws(() => new BrokenStore().build(), /Feature sem componente: aiAssistant/);
});

test('registry impede substituição silenciosa de componentes', () => {
  const registry = new ComponentRegistry();
  const component = { id: 'catalog', feature: 'catalog' as const, service: 'catalog' };
  registry.register(component);
  assert.throws(() => registry.register(component), /duplicado/);
});
