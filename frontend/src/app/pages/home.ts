import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, errorMessage } from '../api';
import { CommerceImage } from '../components/images';
import { CategoryIcon } from '../components/category-icon';
import { Store, categoryList } from '../models/commerce';
@Component({
  standalone: true,
  imports: [RouterLink, CurrencyPipe, FormsModule, CommerceImage, CategoryIcon],
  template: `
    <main class="container">
      <section class="landing-hero">
        <div class="hero-copy">
          <span class="eyebrow"><span class="live-dot"></span> SUA PRÓXIMA IDEIA COMEÇA AQUI</span>
          <h1>Seu negócio.<br />Sua identidade.<br /><span>Sua loja, gerada.</span></h1>
          <p>
            Transforme uma ideia em uma loja de verdade. Escolha seu estilo, combine funcionalidades
            e abra as portas para novas possibilidades.
          </p>
          <div class="hero-actions">
            <a class="button" routerLink="/criar">Começar minha loja <span>↗</span></a
            ><a class="text-link" href="#lojas">Conhecer a plataforma ↓</a>
          </div>
          <div class="hero-notes">
            <span>✓ Sem complicação</span><span>✓ Do seu jeito</span
            ><span>✓ Pronta em minutos</span>
          </div>
        </div>
        <div class="hero-canvas" aria-label="Prévia ilustrativa das categorias de loja">
          <div class="canvas-grid"></div>
          <span class="floating-label label-top">✳ Feita para a sua ideia</span>
          <div class="mock-browser">
            <div class="browser-bar">
              <span>● ● ●</span><small>gerar / sua-loja</small><span>↗</span>
            </div>
            <div class="mock-shop">
              <span class="mock-logo">studio<span> / sua marca</span></span>
              <div class="mock-banner">
                <small>NOVA COLEÇÃO</small><strong>O próximo<br />capítulo é seu.</strong
                ><span>Explore o novo ↗</span>
                <div class="mock-shape">✳</div>
              </div>
              <div class="mock-products">
                <div>
                  <span class="sample-object"
                    ><category-icon category="eletronicos" [size]="34" /></span
                  ><small>Seu produto</small>
                </div>
                <div>
                  <span class="sample-object"
                    ><category-icon category="construcao" [size]="34" /></span
                  ><small>Sua coleção</small>
                </div>
                <div>
                  <span class="sample-object"><category-icon category="roupas" [size]="34" /></span
                  ><small>Seu estilo</small>
                </div>
              </div>
            </div>
          </div>
          <div class="floating-label label-bottom">
            <span class="success-icon">✓</span>
            <div>Sua loja está pronta<small>Uma ideia que ganhou endereço.</small></div>
          </div>
          <span class="canvas-caption">COMPONHA. PERSONALIZE. CRESÇA.</span>
        </div>
      </section>
      <section class="category-strip">
        <span>UM COMEÇO PARA CADA NEGÓCIO</span>
        @for (category of categories; track category.id) {
          <button (click)="filter.set(category.id)" [style.--accent]="category.color">
            <b><category-icon [category]="category.id" [size]="38" /></b>{{ category.name
            }}<span>↗</span>
          </button>
        }
      </section>
      <section class="section" id="lojas">
        <div class="section-title">
          <div>
            <span class="eyebrow">IDEIAS QUE GANHAM FORMA</span>
            <h2>Explore as lojas.</h2>
            <p>Negócios diferentes. A mesma liberdade de criar.</p>
          </div>
          <a class="text-link" routerLink="/criar">Sua loja pode estar aqui ↗</a>
        </div>
        <div class="toolbar">
          <div class="tabs">
            <button [class.active]="filter() === ''" (click)="filter.set('')">Todas</button>
            @for (category of categories; track category.id) {
              <button [class.active]="filter() === category.id" (click)="filter.set(category.id)">
                {{ category.name }}
              </button>
            }
          </div>
          <input
            class="search"
            aria-label="Buscar lojas"
            [(ngModel)]="query"
            placeholder="⌕  Buscar uma loja…"
          />
        </div>
        @if (error()) {
          <div class="notice error" role="alert">
            {{ error() }} <button class="text-link" (click)="load()">Tentar novamente</button>
          </div>
        }
        @if (loading()) {
          <div class="empty">Carregando lojas…</div>
        } @else {
          <div class="store-grid">
            @for (store of filtered(); track store.slug) {
              <a
                class="store-card"
                [routerLink]="['/loja', store.slug]"
                [style.--accent]="store.blueprint.theme.accent"
                ><div class="store-cover">
                  <commerce-image
                    [src]="store.cover"
                    [frame]="store.coverFrame"
                    [alt]="store.name"
                  /><span class="pill">{{ store.blueprint.theme.name }}</span>
                </div>
                <div class="store-card-body">
                  <span class="store-avatar">{{ store.name.slice(0, 1) }}</span>
                  <h3>{{ store.name }}</h3>
                  <p>{{ store.description }}</p>
                  <span class="card-link">Visitar loja <b>↗</b></span>
                </div></a
              >
            }
            <a class="create-card" routerLink="/criar"
              ><span>＋</span>
              <h3>O próximo endereço<br />pode ser o seu.</h3>
              <p>Uma loja com a sua identidade,<br />criada do seu jeito.</p>
              <strong>Criar minha loja ↗</strong></a
            >
          </div>
          @if (stores().length && !filtered().length) {
            <p class="muted">Nenhuma loja encontrada com esses filtros.</p>
          }
        }
      </section>
      <section class="plans-section">
        <div class="section-title">
          <div>
            <span class="eyebrow">ESCOLHA COMO COMEÇAR</span>
            <h2>Uma base completa.<br />Mais possibilidades para crescer.</h2>
          </div>
          <p>
            Todos os planos incluem o essencial para sua loja.<br />Valores ilustrativos, sem
            contratação ou cobrança real.
          </p>
        </div>
        <div class="plans">
          @for (p of plans; track p.name) {
            <article class="plan-card" [class.featured]="p.name === 'Completo'">
              <span class="eyebrow">{{ p.label }}</span>
              <h3>{{ p.name }}</h3>
              <p>{{ p.description }}</p>
              <div class="plan-price">{{ p.price | currency: 'BRL' }}<small>/mês</small></div>
              <ul>
                @for (item of p.items; track item) {
                  <li>✓ {{ item }}</li>
                }
              </ul>
              <a class="button" routerLink="/criar">Começar com {{ p.name }} ↗</a>
            </article>
          }
        </div>
      </section>
    </main>
  `,
})
export class HomePage {
  api = inject(Api);
  stores = signal<Store[]>([]);
  loading = signal(true);
  error = signal('');
  filter = signal('');
  query = '';
  categories = categoryList;
  plans = [
    {
      name: 'Essencial',
      label: 'PARA TIRAR DO PAPEL',
      price: 59.9,
      description: 'Tudo que sua loja precisa para começar.',
      items: ['Catálogo, carrinho e checkout', 'Estoque e pedidos', 'Painel e recomendações'],
    },
    {
      name: 'Completo',
      label: 'MAIS POSSIBILIDADES',
      price: 79.9,
      description: 'Sua base com os adicionais que você escolher.',
      items: ['Tudo do Essencial', 'Cupons de desconto', 'Avaliações e entrega local'],
    },
    {
      name: 'Inteligente',
      label: 'UM NOVO JEITO DE GERIR',
      price: 99.9,
      description: 'Uma loja com um agente de IA ao seu lado.',
      items: [
        'Todos os opcionais disponíveis',
        'Agente com Mastra + Gemini',
        'Consultas de estoque e vendas',
      ],
    },
  ];
  constructor() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      this.stores.set(await this.api.get('/stores'));
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  filtered() {
    return this.stores().filter(
      (s) =>
        (!this.filter() || s.category === this.filter()) &&
        s.name.toLowerCase().includes(this.query.toLowerCase()),
    );
  }
}
