import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Api, errorMessage, readImage } from '../api';
import {
  Store,
  Product,
  Order,
  Feature,
  ProductDraft,
  StoreDraft,
  categoryList,
  newProduct,
  newStore,
  plan,
} from '../models/commerce';
import { FeaturePicker } from '../components/features';
@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, FeaturePicker],
  template: `
    <main class="container admin-page">
      @if (loading()) {
        <div class="empty">Carregando painel…</div>
      } @else if (!shop()) {
        <div class="empty">
          <h1>Loja não encontrada.</h1>
          <p>{{ error() }}</p>
          <a class="button" routerLink="/">Voltar à plataforma</a>
        </div>
      } @else if (!authenticated()) {
        <section class="login-layout">
          <div class="login-intro">
            <span class="eyebrow">O PRÓXIMO PASSO DA SUA LOJA</span>
            <h1>Boas ideias<br />merecem<br /><span>uma boa gestão.</span></h1>
            <p>Seu catálogo, suas escolhas e as configurações da sua loja, em um só lugar.</p>
            <a class="text-link" [routerLink]="['/loja', slug]">← Voltar para {{ shop()!.name }}</a>
          </div>
          <form class="panel login-panel" (ngSubmit)="login()">
            <span class="login-icon">↗</span>
            <h2>Entre na sua loja.</h2>
            <p class="muted">
              Painel de administração de <strong>{{ shop()!.name }}</strong>
            </p>
            <label>Endereço<input [value]="'/admin/' + slug" readonly /></label
            ><label
              >Senha de administração<input
                type="password"
                name="password"
                [(ngModel)]="password"
                autocomplete="current-password"
                required
                minlength="6"
                maxlength="128"
                placeholder="A senha que você cadastrou"
            /></label>
            @if (error()) {
              <div class="notice error" role="alert">{{ error() }}</div>
            }
            <button class="button wide" [disabled]="busy()">
              {{ busy() ? 'Entrando…' : 'Entrar no painel ↗' }}
            </button>
            <p class="muted">Acesso simples para a demonstração do projeto.</p>
          </form>
        </section>
      } @else {
        <div class="admin-title">
          <div>
            <span class="eyebrow">SEU ESPAÇO DE GESTÃO</span>
            <h1>{{ shop()!.name }}</h1>
            <p>Bem-vindo ao próximo capítulo da sua loja.</p>
          </div>
          <div class="hero-actions">
            <a class="button secondary" [routerLink]="['/loja', slug]">Visitar loja ↗</a
            ><button class="text-link" (click)="logout()">Sair</button>
          </div>
        </div>
        <div class="admin-stats">
          <article>
            <span>Vendas simuladas</span><strong>{{ revenue() / 100 | currency: 'BRL' }}</strong
            ><small>Somente pedidos aprovados</small>
          </article>
          <article>
            <span>Pedidos</span><strong>{{ orders().length }}</strong
            ><small>{{ paidOrders() }} aprovados</small>
          </article>
          <article>
            <span>Produtos na loja</span><strong>{{ products().length }}</strong
            ><small>{{ stockTotal() }} unidades disponíveis</small>
          </article>
          <article>
            <span>Seu plano · {{ shop()!.blueprint.plan.name }}</span
            ><strong
              >{{ shop()!.blueprint.plan.monthlyInCents / 100 | currency: 'BRL'
              }}<small>/mês</small></strong
            ><small>Valor fictício · sem cobrança</small>
          </article>
        </div>
        <nav class="admin-tabs" aria-label="Seções administrativas">
          @for (item of tabs; track item.id) {
            @if (item.id !== 'assistant' || has('aiAssistant')) {
              <button [class.active]="tab() === item.id" (click)="switchTab(item.id)">
                {{ item.label }}
              </button>
            }
          }
        </nav>
        @if (error()) {
          <div class="notice error" role="alert">{{ error() }}</div>
        }
        @if (message()) {
          <div class="notice success" role="status">{{ message() }}</div>
        }
        @if (tab() === 'products') {
          <section class="panel">
            <div class="section-title">
              <div>
                <h2>Seu catálogo.</h2>
                <p>Cuide dos produtos que dão vida à sua loja.</p>
              </div>
              <button class="button" (click)="editProduct(null)">＋ Novo produto</button>
            </div>
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  @for (product of products(); track product.id) {
                    <tr>
                      <td>
                        <strong>{{ product.name }}</strong
                        ><small>{{ product.description }}</small>
                      </td>
                      <td>{{ product.priceInCents / 100 | currency: 'BRL' }}</td>
                      <td>
                        <span class="pill" [class.red]="available(product.id) === 0"
                          >{{ available(product.id) }} un.</span
                        >
                      </td>
                      <td class="table-actions">
                        <button class="text-link" (click)="editProduct(product)">Editar</button
                        ><button
                          class="text-link danger"
                          (click)="deleteCandidate.set(product)"
                          [disabled]="products().length <= 1 || busy()"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
        @if (tab() === 'orders') {
          <section class="panel">
            <div class="section-title">
              <div>
                <h2>Cada escolha, um pedido.</h2>
                <p>Histórico de compras simuladas desta loja.</p>
              </div>
              <button class="button secondary" (click)="loadData()" [disabled]="busy()">
                Atualizar ↻
              </button>
            </div>
            @if (!orders().length) {
              <div class="empty">
                Sua loja ainda não recebeu pedidos. Faça uma compra simulada na vitrine.
              </div>
            } @else {
              <div class="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Produtos</th>
                      <th>Data</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of orders(); track order.id) {
                      <tr>
                        <td>
                          <strong>#{{ order.id.slice(0, 8) }}</strong>
                        </td>
                        <td>
                          @for (item of order.items; track item.productId) {
                            <small>{{ item.quantity }} × {{ item.name }}</small>
                          }
                        </td>
                        <td>{{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                        <td>{{ order.totalInCents / 100 | currency: 'BRL' }}</td>
                        <td>
                          <span
                            class="pill"
                            [class.green]="order.status === 'paid'"
                            [class.red]="order.status === 'declined'"
                            >{{ order.status === 'paid' ? 'Aprovado' : 'Recusado' }}</span
                          >
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        }
        @if (tab() === 'settings') {
          <form (ngSubmit)="saveSettings()" class="settings-layout">
            <div class="panel">
              <div class="panel-title">
                <div>
                  <h2>Uma loja com a sua identidade.</h2>
                  <p>Atualize os detalhes e as funcionalidades quando quiser.</p>
                </div>
              </div>
              <label
                >Nome da loja<input
                  name="name"
                  [(ngModel)]="settings.name"
                  required
                  minlength="2"
                  maxlength="80" /></label
              ><label
                >Endereço<input [value]="'/loja/' + slug" readonly /><small
                  >O endereço permanece fixo para preservar os links da loja.</small
                ></label
              ><label
                >Descrição<textarea
                  name="description"
                  [(ngModel)]="settings.description"
                  required
                  maxlength="600"
                ></textarea></label
              ><label
                >Categoria<select name="category" [(ngModel)]="settings.category">
                  @for (category of categories; track category.id) {
                    <option [value]="category.id">{{ category.name }}</option>
                  }
                </select></label
              ><label>Foto de capa</label
              ><label class="upload-area" for="settings-cover"
                ><img [src]="settings.cover" alt="Capa atual da loja" /><span>Trocar imagem ↗</span
                ><input
                  class="file-input"
                  id="settings-cover"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  (change)="upload($event)" /></label
              ><label
                >Ou use uma imagem por URL<input
                  name="coverUrl"
                  [ngModel]="settings.cover.startsWith('https://') ? settings.cover : ''"
                  (ngModelChange)="settings.cover = $event"
                  placeholder="https://…" /></label
              ><feature-picker [features]="features()" [options]="settings.options" /><button
                class="button"
                [disabled]="busy()"
              >
                {{ busy() ? 'Salvando…' : 'Salvar configurações ↗' }}
              </button>
            </div>
            <aside class="panel settings-plan">
              <span class="eyebrow">SUAS ESCOLHAS, SEU PLANO</span>
              <h2>{{ settingsPlan().name }}</h2>
              <div class="plan-price">
                {{ settingsPlan().price / 100 | currency: 'BRL' }}<small>/mês</small>
              </div>
              <p>{{ settings.options.length }} opcionais selecionados.</p>
              <p class="muted">
                Ao salvar, o framework recompõe as funcionalidades e atualiza o plano. Nenhuma
                cobrança será feita.
              </p>
            </aside>
          </form>
        }
        @if (tab() === 'assistant' && has('aiAssistant')) {
          <section class="panel assistant-panel">
            <span class="ai-badge">✦ MASTRA + GEMINI</span>
            <h2>Uma nova perspectiva da sua loja.</h2>
            <p class="muted">Consulte o estoque e os pedidos desta loja com seu agente de IA.</p>
            <div class="suggestions">
              <button (click)="question = 'Quais produtos estão com estoque baixo?'">
                Como está meu estoque?</button
              ><button (click)="question = 'Qual é o total de vendas aprovadas desta loja?'">
                Qual é o resumo das vendas?
              </button>
            </div>
            <form (ngSubmit)="ask()">
              <label for="question"
                >Sua pergunta<textarea
                  id="question"
                  name="question"
                  [(ngModel)]="question"
                  required
                  maxlength="1500"
                  placeholder="O que você quer saber sobre a sua loja?"
                ></textarea></label
              ><button class="button" [disabled]="busy()">
                {{ busy() ? 'Consultando…' : '✦ Consultar agente' }}
              </button>
            </form>
            @if (answer()) {
              <div class="answer" aria-live="polite">{{ answer() }}</div>
            }
          </section>
        }
        @if (editing()) {
          <div class="modal-backdrop" (click)="!busy() && editing.set(false)"></div>
          <section class="dialog" role="dialog" aria-modal="true" aria-label="Editar produto">
            <div class="drawer-header">
              <h2>{{ editingId ? 'Editar produto' : 'Novo produto' }}</h2>
              <button
                class="icon-button"
                (click)="editing.set(false)"
                [disabled]="busy()"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <form (ngSubmit)="saveProduct()">
              <label
                >Nome<input
                  name="name"
                  [(ngModel)]="productDraft.name"
                  maxlength="100"
                  required /></label
              ><label
                >Descrição<textarea
                  name="description"
                  [(ngModel)]="productDraft.description"
                  required
                  maxlength="600"
                ></textarea>
              </label>
              <div class="form-row">
                <label
                  >Preço (R$)<input
                    type="number"
                    name="price"
                    [ngModel]="productDraft.priceInCents / 100"
                    (ngModelChange)="productDraft.priceInCents = cents($event)"
                    min="0.01"
                    max="1000000"
                    step="0.01"
                    required /></label
                ><label
                  >Estoque disponível<input
                    type="number"
                    name="stock"
                    [(ngModel)]="productDraft.stock"
                    min="0"
                    max="1000000"
                    step="1"
                    required
                /></label>
              </div>
              <label
                >Imagem <small>URL HTTPS, opcional</small
                ><input
                  type="url"
                  name="image"
                  [(ngModel)]="productDraft.image"
                  placeholder="https://…"
              /></label>
              @if (productError()) {
                <div class="notice error" role="alert">{{ productError() }}</div>
              }
              <button class="button wide" [disabled]="busy()">
                {{ busy() ? 'Salvando…' : 'Salvar produto' }}
              </button>
            </form>
          </section>
        }
        @if (deleteCandidate(); as product) {
          <div class="modal-backdrop" (click)="deleteCandidate.set(null)"></div>
          <section
            class="dialog compact"
            role="dialog"
            aria-modal="true"
            aria-label="Excluir produto"
          >
            <h2>Excluir {{ product.name }}?</h2>
            <p>O produto deixará de aparecer na vitrine. O histórico dos pedidos será mantido.</p>
            <div class="hero-actions">
              <button
                class="button secondary"
                (click)="deleteCandidate.set(null)"
                [disabled]="busy()"
              >
                Cancelar</button
              ><button
                class="button danger-button"
                (click)="removeProduct(product)"
                [disabled]="busy()"
              >
                Excluir produto
              </button>
            </div>
          </section>
        }
      }
    </main>
  `,
})
export class AdminPage {
  api = inject(Api);
  route = inject(ActivatedRoute);
  slug = '';
  loading = signal(true);
  shop = signal<Store | null>(null);
  authenticated = signal(false);
  error = signal('');
  message = signal('');
  busy = signal(false);
  password = '';
  tab = signal('products');
  products = signal<Product[]>([]);
  orders = signal<Order[]>([]);
  stock = signal<any[]>([]);
  features = signal<Feature[]>([]);
  settings: StoreDraft = newStore();
  categories = categoryList;
  tabs = [
    { id: 'products', label: 'Produtos e estoque' },
    { id: 'orders', label: 'Pedidos' },
    { id: 'settings', label: 'Configurações' },
    { id: 'assistant', label: '✦ Agente de IA' },
  ];
  editing = signal(false);
  editingId = '';
  productDraft = newProduct();
  productError = signal('');
  deleteCandidate = signal<Product | null>(null);
  question = '';
  answer = signal('');
  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.slug = params.get('slug')!;
      void this.load();
    });
  }
  async load() {
    this.loading.set(true);
    this.shop.set(null);
    this.authenticated.set(false);
    this.error.set('');
    this.tab.set('products');
    try {
      this.shop.set(await this.api.get('/stores/' + this.slug));
      try {
        await this.api.get('/stores/' + this.slug + '/session');
        this.authenticated.set(true);
        await this.loadData();
      } catch (e: any) {
        if (e.status !== 401) throw e;
      }
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  async login() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.post('/stores/' + this.slug + '/login', { password: this.password });
      this.password = '';
      this.authenticated.set(true);
      await this.loadData();
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async logout() {
    try {
      await this.api.post('/stores/' + this.slug + '/logout', {});
      this.authenticated.set(false);
      this.products.set([]);
      this.orders.set([]);
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
  async loadData() {
    try {
      const [products, stock, orders, features] = await Promise.all([
        this.api.get<Product[]>('/stores/' + this.slug + '/products'),
        this.api.get<any[]>('/stores/' + this.slug + '/stock'),
        this.api.get<Order[]>('/stores/' + this.slug + '/orders'),
        this.api.get('/features'),
      ]);
      this.products.set(products);
      this.stock.set(stock);
      this.orders.set(orders);
      this.features.set(features.features);
      this.resetSettings();
    } catch (e: any) {
      this.error.set(errorMessage(e));
      if (e.status === 401) this.authenticated.set(false);
    }
  }
  resetSettings() {
    const shop = this.shop()!;
    this.settings = { ...newStore(), ...shop, options: [...shop.options] };
  }
  has(feature: string) {
    return this.shop()?.options.includes(feature) ?? false;
  }
  available(id: string) {
    return this.stock().find((s) => s.productId === id)?.available ?? 0;
  }
  stockTotal() {
    return this.stock().reduce((sum, s) => sum + s.available, 0);
  }
  paidOrders() {
    return this.orders().filter((o) => o.status === 'paid').length;
  }
  revenue() {
    return this.orders()
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + o.totalInCents, 0);
  }
  switchTab(id: string) {
    this.tab.set(id);
    this.error.set('');
    this.message.set('');
  }
  settingsPlan() {
    return plan(this.settings.options);
  }
  cents(value: number) {
    return Math.round(Number(value) * 100);
  }
  async upload(event: Event) {
    try {
      const value = await readImage(event);
      if (value) this.settings.cover = value;
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
  async saveSettings() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    try {
      this.shop.set(await this.api.put('/stores/' + this.slug + '/settings', this.settings));
      this.resetSettings();
      this.message.set('Configurações salvas. Sua loja já está com a nova composição.');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  editProduct(product: Product | null) {
    this.editingId = product?.id ?? '';
    this.productDraft = product ? { ...product, stock: this.available(product.id) } : newProduct();
    this.productError.set('');
    this.editing.set(true);
  }
  async saveProduct() {
    if (this.busy()) return;
    this.busy.set(true);
    this.productError.set('');
    try {
      const path = '/stores/' + this.slug + '/products';
      if (this.editingId) await this.api.put(path + '/' + this.editingId, this.productDraft);
      else await this.api.post(path, this.productDraft);
      this.editing.set(false);
      await this.loadData();
      this.message.set('Produto salvo.');
    } catch (e) {
      this.productError.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async removeProduct(product: Product) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.api.delete('/stores/' + this.slug + '/products/' + product.id);
      this.deleteCandidate.set(null);
      await this.loadData();
      this.message.set('Produto removido da vitrine.');
    } catch (e) {
      this.error.set(errorMessage(e));
      this.deleteCandidate.set(null);
    } finally {
      this.busy.set(false);
    }
  }
  async ask() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.answer.set('');
    try {
      this.answer.set(
        (await this.api.post('/stores/' + this.slug + '/assistant', { message: this.question }))
          .text,
      );
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
