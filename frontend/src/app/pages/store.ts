import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Api, errorMessage, customerId } from '../api';
import { Store, Product, Order } from '../models/commerce';
@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  template: `
    @if (loading()) {
      <main class="container empty">Preparando sua visita…</main>
    } @else if (!shop()) {
      <main class="container empty">
        <h1>Não encontramos essa loja.</h1>
        <p>{{ error() }}</p>
        <a class="button" routerLink="/">Explorar lojas</a>
      </main>
    }
    @if (shop(); as store) {
      <main
        class="shop-page"
        [style.--accent]="store.blueprint.theme.accent"
        [style.--surface]="store.blueprint.theme.surface"
      >
        <div class="store-announcement">
          {{
            has('delivery')
              ? 'Retirada na loja ou entrega local por R$ 15,00'
              : 'Compre online e retire na loja'
          }}
          <span>·</span>
          {{
            has('coupons')
              ? '10% na primeira escolha com BOASVINDAS10'
              : 'Encontre a sua próxima escolha'
          }}
        </div>
        <div class="container shop-header">
          <a class="shop-brand" [routerLink]="['/loja', store.slug]"
            ><span>{{ store.name.slice(0, 1) }}</span
            >{{ store.name }}</a
          >
          <nav>
            <a href="#colecao">Coleção</a><a [routerLink]="['/admin', store.slug]">Administrar</a
            ><button class="button" (click)="cartOpen.set(true)">
              Sacola <span class="count">{{ cartCount() }}</span>
            </button>
          </nav>
        </div>
        <section class="container shop-hero">
          <div class="shop-hero-copy">
            <span class="eyebrow">{{ store.blueprint.theme.name }} · FEITO PARA VOCÊ</span>
            <h1>
              {{ store.name }}<span>Novas escolhas.<br />Do seu jeito.</span>
            </h1>
            <p>{{ store.description }}</p>
            <a class="button" href="#colecao">Explorar a coleção ↗</a>
          </div>
          <div class="shop-hero-image">
            <img [src]="store.cover" [alt]="'Capa da loja ' + store.name" /><span
              class="image-label"
              >{{ store.blueprint.theme.icon }} {{ store.blueprint.theme.name }}</span
            >
          </div>
        </section>
        <section class="container section" id="colecao">
          <div class="section-title">
            <div>
              <span class="eyebrow">ENCONTRE SEU PRÓXIMO FAVORITO</span>
              <h2>Nossa coleção.</h2>
            </div>
            <input
              class="search"
              [(ngModel)]="query"
              aria-label="Buscar produtos"
              placeholder="⌕  Buscar produto…"
            />
          </div>
          @if (error()) {
            <div class="notice error" role="alert">{{ error() }}</div>
          }
          @if (receipt(); as order) {
            <div class="notice success" role="status">
              <strong>{{
                order.status === 'paid'
                  ? 'Compra simulada confirmada!'
                  : 'Pagamento simulado recusado.'
              }}</strong>
              <p>
                Pedido {{ order.id.slice(0, 8) }} ·
                {{ order.totalInCents / 100 | currency: 'BRL' }} ·
                {{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}
              </p>
              <span>{{
                order.status === 'paid'
                  ? 'Seu pedido foi registrado e o estoque foi atualizado.'
                  : 'Seu estoque foi liberado. Você pode tentar uma nova compra.'
              }}</span>
            </div>
          }
          <div class="product-grid">
            @for (product of filtered(); track product.id) {
              <article class="product-card">
                <div class="product-picture">
                  @if (product.image) {
                    <img [src]="product.image" [alt]="product.name" loading="lazy" />
                  } @else {
                    <span>{{ store.blueprint.theme.icon }}</span>
                  }
                  <span class="product-stock">{{
                    available(product.id) > 0 ? available(product.id) + ' disponíveis' : 'Esgotado'
                  }}</span>
                </div>
                <div class="product-body">
                  <h3>{{ product.name }}</h3>
                  <p>{{ product.description }}</p>
                  <div class="product-buy">
                    <strong>{{ product.priceInCents / 100 | currency: 'BRL' }}</strong
                    ><button
                      class="add-button"
                      [disabled]="available(product.id) <= quantity(product.id) || paying()"
                      (click)="add(product)"
                      [attr.aria-label]="'Adicionar ' + product.name"
                    >
                      ＋
                    </button>
                  </div>
                  @if (has('reviews')) {
                    <button class="review-link" (click)="openReviews(product)">
                      ☆ Ver avaliações e avaliar
                    </button>
                  }
                </div>
              </article>
            }
          </div>
          @if (!filtered().length) {
            <div class="empty">Nenhum produto encontrado.</div>
          }
        </section>
        @if (recommendations().length) {
          <section class="container recommendation-section">
            <div>
              <span class="eyebrow">ESCOLHAS QUE COMBINAM COM VOCÊ</span>
              <h2>Vale conhecer também.</h2>
              <p>
                {{
                  recommendationStrategy() === 'history-category'
                    ? 'Sugestões a partir das suas compras nesta loja.'
                    : 'Algumas escolhas da nossa coleção para começar.'
                }}
              </p>
            </div>
            <div class="recommendation-items">
              @for (product of recommendations(); track product.id) {
                <button
                  (click)="add(product)"
                  [disabled]="available(product.id) <= quantity(product.id) || paying()"
                >
                  <span
                    >{{ product.name
                    }}<small>{{ product.priceInCents / 100 | currency: 'BRL' }}</small></span
                  ><b>＋</b>
                </button>
              }
            </div>
          </section>
        }
        <div class="container shop-signature">
          <span>{{ store.name }}</span>
          <p>Uma loja criada com Gerar Commerce.</p>
          <small>Ambiente acadêmico · Todas as compras são simuladas.</small>
        </div>
        @if (cartOpen()) {
          <div class="modal-backdrop" (click)="!paying() && cartOpen.set(false)"></div>
          <section class="cart-drawer" role="dialog" aria-modal="true" aria-label="Sua sacola">
            <div class="drawer-header">
              <div>
                <span class="eyebrow">SUAS ESCOLHAS</span>
                <h2>
                  Sua sacola <small>({{ cartCount() }})</small>
                </h2>
              </div>
              <button
                class="icon-button"
                aria-label="Fechar sacola"
                (click)="cartOpen.set(false)"
                [disabled]="paying()"
              >
                ×
              </button>
            </div>
            @if (!cartLines().length) {
              <div class="empty">
                <span class="empty-icon">▱</span>
                <h3>Ainda cabe uma boa escolha.</h3>
                <p>Explore a coleção e adicione seus favoritos.</p>
                <button class="button" (click)="cartOpen.set(false)">Continuar explorando</button>
              </div>
            } @else {
              <div class="cart-content">
                @for (line of cartLines(); track line.product.id) {
                  <div class="cart-line">
                    <div class="cart-thumb">
                      @if (line.product.image) {
                        <img [src]="line.product.image" alt="" />
                      } @else {
                        <span>{{ store.blueprint.theme.icon }}</span>
                      }
                    </div>
                    <div>
                      <strong>{{ line.product.name }}</strong
                      ><small>{{ line.product.priceInCents / 100 | currency: 'BRL' }}</small>
                      <div class="quantity">
                        <button
                          (click)="change(line.product.id, -1)"
                          [disabled]="paying()"
                          aria-label="Diminuir quantidade"
                        >
                          −</button
                        ><span>{{ line.quantity }}</span
                        ><button
                          (click)="change(line.product.id, 1)"
                          [disabled]="paying() || line.quantity >= available(line.product.id)"
                          aria-label="Aumentar quantidade"
                        >
                          ＋
                        </button>
                      </div>
                    </div>
                    <button
                      class="icon-button"
                      (click)="remove(line.product.id)"
                      [disabled]="paying()"
                      [attr.aria-label]="'Remover ' + line.product.name"
                    >
                      ×
                    </button>
                  </div>
                }
                @if (has('coupons')) {
                  <label
                    >Cupom de desconto<input
                      [(ngModel)]="coupon"
                      (ngModelChange)="reference = ''"
                      placeholder="BOASVINDAS10"
                      [disabled]="paying()"
                  /></label>
                }
                <label
                  >Recebimento<select
                    [(ngModel)]="fulfillment"
                    (ngModelChange)="reference = ''"
                    [disabled]="paying()"
                  >
                    <option value="pickup">Retirada na loja · grátis</option>
                    @if (has('delivery')) {
                      <option value="delivery">Entrega local · R$ 15,00</option>
                    }
                  </select></label
                >
                <label
                  >Pagamento simulado<select
                    [(ngModel)]="payment"
                    (ngModelChange)="reference = ''"
                    [disabled]="paying()"
                  >
                    <option value="approved">Simular aprovação</option>
                    <option value="declined">Simular recusa</option>
                  </select></label
                >
              </div>
              <div class="cart-footer">
                <div class="summary-line">
                  <span>Subtotal</span><strong>{{ subtotal() / 100 | currency: 'BRL' }}</strong>
                </div>
                @if (discount()) {
                  <div class="summary-line">
                    <span>Desconto</span><strong>− {{ discount() / 100 | currency: 'BRL' }}</strong>
                  </div>
                }
                <div class="summary-line">
                  <span>Entrega</span><strong>{{ shipping() / 100 | currency: 'BRL' }}</strong>
                </div>
                <div class="cart-total">
                  <span>Total</span><strong>{{ total() / 100 | currency: 'BRL' }}</strong>
                </div>
                @if (checkoutError()) {
                  <div class="notice error" role="alert">{{ checkoutError() }}</div>
                }
                <button class="button wide" (click)="checkout()" [disabled]="paying()">
                  {{ paying() ? 'Processando…' : 'Finalizar compra simulada ↗' }}
                </button>
                <p class="muted">Sem cobrança real ou dados de cartão.</p>
              </div>
            }
          </section>
        }
        @if (reviewProduct(); as product) {
          <div class="modal-backdrop" (click)="reviewProduct.set(null)"></div>
          <section
            class="dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Avaliações do produto"
          >
            <div class="drawer-header">
              <div>
                <span class="eyebrow">AVALIAÇÕES</span>
                <h2>{{ product.name }}</h2>
              </div>
              <button
                class="icon-button"
                aria-label="Fechar avaliações"
                (click)="reviewProduct.set(null)"
              >
                ×
              </button>
            </div>
            <div class="review-list">
              @for (review of reviews(); track review.id) {
                <article>
                  <strong
                    >{{ review.author }}
                    <span class="stars">{{ '★'.repeat(review.rating) }}</span></strong
                  >
                  <p>{{ review.comment }}</p>
                </article>
              }
              @if (!reviews().length) {
                <p class="muted">Seja a primeira pessoa a avaliar este produto.</p>
              }
            </div>
            <form (ngSubmit)="submitReview()">
              <label
                >Seu nome<input
                  name="author"
                  [(ngModel)]="reviewDraft.author"
                  required
                  maxlength="60" /></label
              ><label
                >Sua nota<select name="rating" [(ngModel)]="reviewDraft.rating">
                  <option [ngValue]="5">★★★★★ · Excelente</option>
                  <option [ngValue]="4">★★★★ · Muito bom</option>
                  <option [ngValue]="3">★★★ · Bom</option>
                  <option [ngValue]="2">★★ · Regular</option>
                  <option [ngValue]="1">★ · Ruim</option>
                </select></label
              ><label
                >Comentário<textarea
                  name="comment"
                  [(ngModel)]="reviewDraft.comment"
                  required
                  maxlength="500"
                ></textarea>
              </label>
              @if (reviewError()) {
                <div class="notice error" role="alert">{{ reviewError() }}</div>
              }
              <button class="button" [disabled]="reviewSaving()">
                {{ reviewSaving() ? 'Enviando…' : 'Publicar avaliação' }}
              </button>
            </form>
          </section>
        }
      </main>
    }
  `,
})
export class StorePage {
  api = inject(Api);
  route = inject(ActivatedRoute);
  slug = '';
  shop = signal<Store | null>(null);
  products = signal<Product[]>([]);
  stock = signal<{ productId: string; available: number }[]>([]);
  loading = signal(true);
  error = signal('');
  recommendations = signal<Product[]>([]);
  recommendationStrategy = signal('');
  query = '';
  cart = signal<Record<string, number>>({});
  cartOpen = signal(false);
  paying = signal(false);
  checkoutError = signal('');
  receipt = signal<Order | null>(null);
  coupon = '';
  fulfillment = 'pickup';
  payment = 'approved';
  reference = '';
  reviewProduct = signal<Product | null>(null);
  reviews = signal<any[]>([]);
  reviewDraft = { author: '', rating: 5, comment: '' };
  reviewError = signal('');
  reviewSaving = signal(false);
  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.slug = params.get('slug')!;
      void this.load();
    });
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    this.shop.set(null);
    this.cartOpen.set(false);
    this.cart.set({});
    try {
      const [shop, products, stock] = await Promise.all([
        this.api.get<Store>('/stores/' + this.slug),
        this.api.get<Product[]>('/stores/' + this.slug + '/products'),
        this.api.get<any[]>('/stores/' + this.slug + '/stock'),
      ]);
      this.shop.set(shop);
      this.products.set(products);
      this.stock.set(stock);
      try {
        const saved = JSON.parse(localStorage.getItem('gerar-cart-' + this.slug) || '{}');
        const clean: Record<string, number> = {};
        for (const product of products) {
          const count = saved[product.id];
          if (Number.isInteger(count) && count > 0)
            clean[product.id] = Math.min(
              count,
              stock.find((s) => s.productId === product.id)?.available ?? 0,
            );
        }
        this.cart.set(clean);
      } catch {}
      try {
        const pending = JSON.parse(localStorage.getItem('gerar-checkout-' + this.slug) || 'null');
        const items = this.cartLines().map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        }));
        if (pending && JSON.stringify(pending.items) === JSON.stringify(items)) {
          this.reference = pending.reference;
          this.coupon = pending.coupon;
          this.payment = pending.payment;
          this.fulfillment = pending.fulfillment;
        }
      } catch {}
      await this.loadRecommendations();
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  async loadRecommendations() {
    try {
      const result = await this.api.get(
        '/stores/' + this.slug + '/recommendations/' + customerId(),
      );
      this.recommendations.set(result.products);
      this.recommendationStrategy.set(result.strategy);
    } catch {
      this.recommendations.set([]);
    }
  }
  has(feature: string) {
    return this.shop()?.blueprint.configuration.features.includes(feature) ?? false;
  }
  filtered() {
    return this.products().filter((p) => p.name.toLowerCase().includes(this.query.toLowerCase()));
  }
  available(id: string) {
    return this.stock().find((s) => s.productId === id)?.available ?? 0;
  }
  quantity(id: string) {
    return this.cart()[id] ?? 0;
  }
  cartLines() {
    return this.products()
      .filter((p) => this.quantity(p.id) > 0)
      .map((product) => ({ product, quantity: this.quantity(product.id) }));
  }
  cartCount() {
    return this.cartLines().reduce((sum, l) => sum + l.quantity, 0);
  }
  saveCart() {
    localStorage.setItem('gerar-cart-' + this.slug, JSON.stringify(this.cart()));
    localStorage.removeItem('gerar-checkout-' + this.slug);
    this.reference = '';
    this.checkoutError.set('');
  }
  add(product: Product) {
    if (this.quantity(product.id) >= this.available(product.id)) return;
    this.cart.update((c) => ({ ...c, [product.id]: (c[product.id] ?? 0) + 1 }));
    this.saveCart();
    this.cartOpen.set(true);
  }
  change(id: string, amount: number) {
    this.cart.update((c) => ({
      ...c,
      [id]: Math.max(0, Math.min((c[id] ?? 0) + amount, this.available(id))),
    }));
    this.saveCart();
  }
  remove(id: string) {
    this.cart.update((c) => ({ ...c, [id]: 0 }));
    this.saveCart();
  }
  subtotal() {
    return this.cartLines().reduce((sum, l) => sum + l.quantity * l.product.priceInCents, 0);
  }
  discount() {
    return this.has('coupons') && this.coupon === 'BOASVINDAS10'
      ? Math.round(this.subtotal() * 0.1)
      : 0;
  }
  shipping() {
    return this.fulfillment === 'delivery' ? (this.shop()?.blueprint.shippingInCents ?? 0) : 0;
  }
  total() {
    return this.subtotal() - this.discount() + this.shipping();
  }
  async checkout() {
    if (this.paying() || !this.cartCount()) return;
    this.paying.set(true);
    this.checkoutError.set('');
    this.reference ||= crypto.randomUUID();
    try {
      const attempt = {
        reference: this.reference,
        customerId: customerId(),
        items: this.cartLines().map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        coupon: this.coupon,
        payment: this.payment,
        fulfillment: this.fulfillment,
      };
      localStorage.setItem('gerar-checkout-' + this.slug, JSON.stringify(attempt));
      const order = await this.api.post<Order>('/stores/' + this.slug + '/checkout', attempt);
      this.receipt.set(order);
      localStorage.removeItem('gerar-checkout-' + this.slug);
      this.reference = '';
      if (order.status === 'paid') {
        this.cart.set({});
        this.saveCart();
      }
      this.cartOpen.set(false);
      try {
        this.stock.set(await this.api.get('/stores/' + this.slug + '/stock'));
      } catch {
        this.error.set('Pedido registrado. Atualize a página para conferir os saldos atuais.');
      }
      await this.loadRecommendations();
    } catch (e) {
      this.checkoutError.set(errorMessage(e));
    } finally {
      this.paying.set(false);
    }
  }
  async openReviews(product: Product) {
    this.reviewProduct.set(product);
    this.reviewError.set('');
    this.reviews.set([]);
    try {
      this.reviews.set(await this.api.get('/stores/' + this.slug + '/reviews/' + product.id));
    } catch (e) {
      this.reviewError.set(errorMessage(e));
    }
  }
  async submitReview() {
    const product = this.reviewProduct();
    if (!product || this.reviewSaving()) return;
    this.reviewSaving.set(true);
    this.reviewError.set('');
    try {
      await this.api.post('/stores/' + this.slug + '/reviews/' + product.id, this.reviewDraft);
      this.reviewDraft.comment = '';
      this.reviews.set(await this.api.get('/stores/' + this.slug + '/reviews/' + product.id));
    } catch (e) {
      this.reviewError.set(errorMessage(e));
    } finally {
      this.reviewSaving.set(false);
    }
  }
}
