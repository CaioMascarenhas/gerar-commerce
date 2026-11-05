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
