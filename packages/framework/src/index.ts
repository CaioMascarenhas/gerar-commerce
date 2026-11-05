import { coreFeatures } from '@gerar/contracts';
import type {
  ApplicationBlueprint,
  ComponentDescriptor,
  Feature,
  ProductConfiguration,
} from '@gerar/contracts';

/** Hotspot de entrega: o framework depende da interface, a aplicação escolhe a política. */
export interface ShippingPolicy {
  quoteInCents(): number;
}
export class PickupShipping implements ShippingPolicy {
  quoteInCents() {
    return 0;
  }
}
export class FlatRateShipping implements ShippingPolicy {
  quoteInCents() {
    return 1500;
  }
}

export class ComponentRegistry {
  private readonly components = new Map<string, ComponentDescriptor>();
  register(component: ComponentDescriptor): void {
    if (this.components.has(component.id)) throw new Error(`Componente duplicado: ${component.id}`);
    this.components.set(component.id, component);
  }
  list(): ComponentDescriptor[] {
    return [...this.components.values()];
  }
}

/** Valida a configuração antes de construir ou iniciar uma aplicação derivada. */
export function validateConfiguration(configuration: ProductConfiguration): void {
  if (!/^[a-z][a-z0-9-]{1,50}$/.test(configuration.id))
    throw new Error('Identificador de produto inválido.');
  if (!configuration.name.trim()) throw new Error('O nome da loja é obrigatório.');
  if (new Set(configuration.features).size !== configuration.features.length)
    throw new Error('Features duplicadas.');
  const known = new Set<string>([...coreFeatures, 'aiAssistant']);
  for (const feature of configuration.features) {
    if (!known.has(feature)) throw new Error(`Feature desconhecida: ${feature}`);
  }
  for (const feature of coreFeatures) {
    if (!configuration.features.includes(feature))
      throw new Error(`Feature obrigatória ausente: ${feature}`);
  }
  if (configuration.payment !== 'simulated')
    throw new Error('Provedor de pagamento não suportado.');
  if (!['pickup', 'flat-rate'].includes(configuration.fulfillment))
    throw new Error('Modalidade de entrega inválida.');
  if (!/^#[0-9a-fA-F]{6}$/.test(configuration.accentColor))
    throw new Error('Cor da loja inválida.');
}

/**
 * Template Method: define a sequência estável de montagem.
 * Hotspots protegidos são implementados pelas aplicações. Não há cópia do core.
 * A construção valida tanto as features quanto os componentes associados.
 */
export abstract class CommerceApplication {
  build(): ApplicationBlueprint {
    const configuration = this.configure();
    validateConfiguration(configuration);
    const registry = new ComponentRegistry();
    this.registerCore(registry);
    this.registerExtensions(registry, configuration);
    const components = registry.list();
    for (const feature of configuration.features) {
      if (!components.some((component) => component.feature === feature)) {
        throw new Error(`Feature sem componente: ${feature}`);
      }
    }
    if (components.some((component) => !configuration.features.includes(component.feature))) {
      throw new Error('Componente registrado para uma feature desabilitada.');
    }
    return { configuration, components, shippingInCents: this.shippingPolicy().quoteInCents() };
  }

  protected abstract configure(): ProductConfiguration;
  protected abstract shippingPolicy(): ShippingPolicy;
  protected registerExtensions(
    _registry: ComponentRegistry,
    _configuration: ProductConfiguration,
  ): void {}

  private registerCore(registry: ComponentRegistry): void {
    const owners: Record<string, string> = {
      catalog: 'catalog',
      inventory: 'inventory',
      cart: 'storefront',
      orders: 'orders',
      checkout: 'orders',
      recommendations: 'recommendations',
      administration: 'storefront',
    };
    for (const feature of coreFeatures)
      registry.register({ id: feature, feature, service: owners[feature] });
  }
}

/** Aplicação 1: somente as funcionalidades obrigatórias, retirada na loja. */
export class EssentialStore extends CommerceApplication {
  protected configure(): ProductConfiguration {
    return {
      id: 'essencial',
      name: 'Gerar Essencial',
      features: [...coreFeatures],
      payment: 'simulated',
      fulfillment: 'pickup',
      accentColor: '#25635a',
    };
  }
  protected shippingPolicy(): ShippingPolicy {
    return new PickupShipping();
  }
}

/** Aplicação 2: mesmo core, extensão de IA e entrega com tarifa fixa. */
export class AssistedStore extends CommerceApplication {
  protected configure(): ProductConfiguration {
    return {
      id: 'assistida',
      name: 'Gerar Assistida',
      features: [...coreFeatures, 'aiAssistant'],
      payment: 'simulated',
      fulfillment: 'flat-rate',
      accentColor: '#4f46a0',
    };
  }
  protected shippingPolicy(): ShippingPolicy {
    return new FlatRateShipping();
  }
  protected override registerExtensions(registry: ComponentRegistry): void {
    registry.register({ id: 'assistant-mastra', feature: 'aiAssistant', service: 'ai-assistant' });
  }
}

export function deriveProduct(profile: string): ApplicationBlueprint {
  if (profile === 'essencial') return new EssentialStore().build();
  if (profile === 'assistida') return new AssistedStore().build();
  throw new Error(`Perfil desconhecido: ${profile}. Use essencial ou assistida.`);
}

export function hasFeature(blueprint: ApplicationBlueprint, feature: Feature): boolean {
  return blueprint.configuration.features.includes(feature);
}
