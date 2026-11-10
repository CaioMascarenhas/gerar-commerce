import { DialogFocus } from '../components/dialog-focus';
import {
  Component,
  computed,
  inject,
  signal,
  afterNextRender,
  Injector,
  DestroyRef,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Api, errorMessage } from '../api';
import { CommerceImage } from '../components/images';
import { BuyerAccount } from '../components/buyer-account';
import { ShoppingChat } from '../components/shopping-chat';
import { Store, Product, Order, Customer } from '../models/commerce';
import { StoreSessions } from '../sessions';
import { CategoryIcon } from '../components/category-icon';
import { checkoutReference } from '../checkout-reference';
@Component({
  standalone: true,
  imports: [
    DialogFocus,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    RouterLink,
    CommerceImage,
    BuyerAccount,
    ShoppingChat,
    CategoryIcon,
  ],
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
              ? 'Cupons especiais cadastrados pela loja'
              : 'Encontre a sua próxima escolha'
          }}
        </div>
        <div class="container shop-header">
          <a class="shop-brand" [routerLink]="['/loja', store.slug]"
            ><span>{{ store.name.slice(0, 1) }}</span
            >{{ store.name }}</a
          >
          <nav>
            <a routerLink="/">Explorar lojas</a>
            <a [routerLink]="['/loja', store.slug]" fragment="colecao">Coleção</a
            ><a [routerLink]="['/admin', store.slug]">Acessar minha loja</a
            ><button class="text-link buyer-account-button" (click)="openAccount()">
              {{
                customer()
                  ? 'Minha conta · ' + customer()!.name.split(' ')[0]
                  : 'Entrar / Criar conta'
              }}</button
            ><button class="button" (click)="cartOpen.set(true)">
              Sacola <span class="count">{{ cartCount() }}</span>
            </button>
          </nav>
        </div>
        <div class="container">
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
        </div>
        @if (productId) {
          <section class="container product-detail">
            <a class="back-link" [routerLink]="['/loja', slug]">← Voltar à coleção</a>
            @if (selectedProduct(); as product) {
              <div class="product-detail-layout">
                <div class="product-detail-image">
                  <commerce-image
                    [src]="product.image"
                    [frame]="product.imageFrame"
                    [alt]="product.name"
                    [eager]="true"
                  />
                </div>
                <div>
                  <span class="eyebrow">{{ store.blueprint.theme.name }}</span>
                  <h1>{{ product.name }}</h1>
                  <p>{{ product.description }}</p>
                  @if (product.imageSource === 'illustrative') {
                    <small class="muted"
                      >Foto ilustrativa. Consulte os detalhes do produto com a loja.</small
                    >
                  }
                  <strong class="detail-price">{{
                    product.priceInCents / 100 | currency: 'BRL'
                  }}</strong>
                  <p>{{ available(product.id) }} unidades disponíveis</p>
                  <button
                    class="button"
                    (click)="add(product)"
                    [disabled]="available(product.id) <= quantity(product.id) || paying()"
                  >
                    {{ available(product.id) ? 'Adicionar à sacola' : 'Esgotado' }}
                  </button>
                  @if (has('reviews')) {
                    <button class="review-link" (click)="openReviews(product)">
                      ☆ Ver avaliações e avaliar
                    </button>
                  }
                  <p class="muted">
                    Explore sem login. Entre na sua conta para finalizar a compra.
                  </p>
                </div>
              </div>
            } @else {
              <div class="empty">
                <h1>Produto não encontrado.</h1>
                <p>Este produto não está disponível nesta loja.</p>
              </div>
            }
          </section>
        } @else {
          <section class="container shop-hero">
            <div class="shop-hero-copy">
              <span class="eyebrow">{{ store.blueprint.theme.name }} · FEITO PARA VOCÊ</span>
              <h1>
                {{ store.name }}<span>Novas escolhas.<br />Do seu jeito.</span>
              </h1>
              <p>{{ store.description }}</p>
              <a class="button" [routerLink]="['/loja', store.slug]" fragment="colecao"
                >Explorar a coleção ↗</a
              >
            </div>
            <div class="shop-hero-image">
              <commerce-image
                [src]="store.cover"
                [frame]="store.coverFrame"
                [alt]="'Capa da loja ' + store.name"
                [eager]="true"
              /><span class="image-label"
                ><category-icon [category]="store.category" [size]="20" />
                {{ store.blueprint.theme.name }}</span
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
            <div class="product-grid">
              @for (product of filtered(); track product.id) {
                <article class="product-card">
                  <a
                    class="product-picture"
                    [routerLink]="['/loja', slug, 'produto', product.id]"
                    [attr.aria-label]="'Ver ' + product.name"
                  >
                    @if (product.image) {
                      <commerce-image
                        [src]="product.image"
                        [frame]="product.imageFrame"
                        [alt]="product.name"
                      />
                    } @else {
                      <category-icon [category]="store.category" [size]="96" />
                    }
                    <span class="product-stock">{{
                      available(product.id) > 0
                        ? available(product.id) + ' disponíveis'
                        : 'Esgotado'
                    }}</span>
                  </a>
                  <div class="product-body">
                    <h3>
                      <a [routerLink]="['/loja', slug, 'produto', product.id]">{{
                        product.name
                      }}</a>
                    </h3>
                    <p>{{ product.description }}</p>
                    @if (product.imageSource === 'illustrative') {
                      <small class="muted">Foto ilustrativa</small>
                    }
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
                      ? 'Sugestões a partir das suas compras e das de outros clientes desta loja.'
                      : recommendationStrategy() === 'store-popularity'
                        ? 'Os mais comprados da nossa coleção.'
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
                      }}<small>{{ product.priceInCents / 100 | currency: 'BRL' }}</small>
                      @if (product.reason) {
                        <small>{{ product.reason }}</small>
                      }</span
                    ><b>＋</b>
                  </button>
                }
              </div>
            </section>
          }
        }
        <div class="container shop-signature">
          <span>{{ store.name }}</span>
          <p>Uma loja criada com Gerar Commerce.</p>
          <small>Ambiente acadêmico · Todas as compras são simuladas.</small>
        </div>
        <button
          class="cart-fab"
          type="button"
          (click)="cartOpen.set(true)"
          [attr.aria-expanded]="cartOpen()"
          aria-controls="cart-drawer"
          [attr.aria-label]="
            'Abrir sacola com ' + cartCount() + (cartCount() === 1 ? ' item' : ' itens')
          "
        >
          <span aria-hidden="true">▱</span> Sacola
          <b class="cart-badge" aria-live="polite">{{ cartCount() }}</b>
        </button>
        @if (has('aiAssistant')) {
          <shopping-chat [slug]="slug" />
        }
        <buyer-account
          [slug]="slug"
          [opened]="accountOpen()"
          [customer]="customer()"
          [storeName]="store.name"
          (closed)="closeAccount()"
          (customerChange)="buyerChanged($event)"
        />
        @if (cartOpen()) {
          <div
            class="modal-backdrop"
            animate.enter="backdrop-enter"
            animate.leave="backdrop-leave"
            (click)="!paying() && cartOpen.set(false)"
          ></div>
          <section
            class="cart-drawer"
            id="cart-drawer"
            dialogFocus
            role="dialog"
            aria-modal="true"
            aria-label="Sua sacola"
            animate.enter="drawer-enter"
            animate.leave="drawer-leave"
            (keydown.escape)="!paying() && cartOpen.set(false)"
          >
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
                        <commerce-image
                          [src]="line.product.image"
                          [frame]="line.product.imageFrame"
                          [alt]="line.product.name"
                        />
                      } @else {
                        <category-icon [category]="store.category" [size]="36" />
                      }
                    </div>
                    <div>
                      <a
                        [routerLink]="['/loja', slug, 'produto', line.product.id]"
                        (click)="cartOpen.set(false)"
                        ><strong>{{ line.product.name }}</strong></a
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
                      (ngModelChange)="clearCoupon()"
                      placeholder="Código do cupom"
                      [disabled]="paying()"
                  /></label>
                  <button
                    class="button secondary small"
                    type="button"
                    (click)="applyCoupon()"
                    [disabled]="paying() || couponBusy() || !coupon.trim()"
                  >
                    {{ couponBusy() ? 'Conferindo…' : 'Aplicar cupom' }}
                  </button>
                  @if (couponQuote()) {
                    <p class="notice success" role="status">
                      Cupom {{ couponQuote().code }} aplicado: {{ couponQuote().percentage }}% de
                      desconto.
                    </p>
                  }
                  @if (couponError()) {
                    <p class="notice error" role="alert">{{ couponError() }}</p>
                  }
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
                  {{
                    paying()
                      ? 'Processando…'
                      : customer()
                        ? 'Finalizar compra simulada ↗'
                        : 'Entrar para finalizar compra'
                  }}
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
            dialogFocus
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
                  @if (review.verifiedPurchase) {
                    <small class="verified-review">Compra verificada</small>
                  }
                  <p>{{ review.comment }}</p>
                </article>
              }
              @if (!reviews().length) {
                <p class="muted">Seja a primeira pessoa a avaliar este produto.</p>
              }
            </div>
            @if (!customer()) {
              <p class="notice">
                Entre na sua conta de comprador para avaliar um produto que você comprou.
              </p>
              <button class="button" (click)="reviewProduct.set(null); openAccount()">
                Entrar para avaliar
              </button>
            } @else if (reviewEligibility() === 'loading') {
              <p role="status">Conferindo sua compra…</p>
            } @else if (reviewEligibility() === 'purchase-required') {
              <p class="notice">
                Você só pode avaliar este produto após uma compra aprovada nesta conta.
              </p>
            } @else if (reviewEligibility() === 'allowed') {
              <form (ngSubmit)="submitReview()">
                <p class="review-author">
                  Avaliando como <strong>{{ customer()!.name }}</strong>
                </p>
                <label
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
            }
            @if (reviewError() && reviewEligibility() !== 'allowed') {
              <p class="notice error" role="alert">{{ reviewError() }}</p>
            }
          </section>
        }
      </main>
    }
  `,
})
export class StorePage {
  api = inject(Api);
  route = inject(ActivatedRoute);
  router = inject(Router);
  sessions = inject(StoreSessions);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);
  slug = '';
  productId = '';
  customer = computed(() => this.sessions.profile(this.slug).buyer);
  accountOpen = signal(false);
  private returnToCart = false;
  couponQuote = signal<any>(null);
  couponBusy = signal(false);
  couponError = signal('');
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
  reviewDraft = { rating: 5, comment: '' };
  reviewEligibility = signal<'loading' | 'allowed' | 'purchase-required' | 'error'>('loading');
  reviewError = signal('');
  reviewSaving = signal(false);
  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.slug = params.get('slug')!;
      this.productId = params.get('productId') ?? '';
      this.accountOpen.set(false);
      this.returnToCart = false;
      this.receipt.set(null);
      this.reviewProduct.set(null);
      this.coupon = '';
      this.reference = '';
      this.couponQuote.set(null);
      void this.load();
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      if (params.get('conta') === '1') this.openAccount();
    });
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    this.shop.set(null);
    this.cartOpen.set(false);
    this.cart.set({});
    try {
      const [shop, products, stock, profiles] = await Promise.all([
        this.api.get<Store>('/stores/' + this.slug),
        this.api.get<Product[]>('/stores/' + this.slug + '/products'),
        this.api.get<any[]>('/stores/' + this.slug + '/stock'),
        this.sessions.refresh(this.slug),
      ]);
      const customer = profiles.buyer;
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
        if (
          pending &&
          pending.customerId === customer?.id &&
          JSON.stringify(pending.items) === JSON.stringify(items)
        ) {
          this.reference = pending.reference;
          this.coupon = pending.coupon;
          this.payment = pending.payment;
          this.fulfillment = pending.fulfillment;
          if (pending.couponQuote) this.couponQuote.set(pending.couponQuote);
        }
      } catch {}
      await this.loadRecommendations();
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
      if (!this.destroyRef.destroyed && this.route.snapshot?.fragment === 'colecao') {
        afterNextRender(
          () => document.getElementById('colecao')?.scrollIntoView({ block: 'start' }),
          { injector: this.injector },
        );
      }
    }
  }
  async loadRecommendations() {
    try {
      const result = await this.api.get('/stores/' + this.slug + '/recommendations');
      this.recommendations.set(result.products);
      this.recommendationStrategy.set(result.strategy);
    } catch {
      this.recommendations.set([]);
    }
  }
  selectedProduct() {
    return this.products().find((product) => product.id === this.productId);
  }
  buyerChanged(customer: Customer | null) {
    this.sessions.setBuyer(this.slug, customer);
    this.reference = '';
    this.checkoutError.set('');
    localStorage.removeItem('gerar-checkout-' + this.slug);
    void this.loadRecommendations();
  }
  openAccount() {
    if (this.paying()) return;
    this.returnToCart = this.cartOpen();
    this.cartOpen.set(false);
    this.accountOpen.set(true);
  }
  closeAccount() {
    this.accountOpen.set(false);
    if (this.returnToCart) this.cartOpen.set(true);
    this.returnToCart = false;
    const url = this.router.parseUrl(this.router.url);
    if (url.queryParams['conta'] === '1') {
      delete url.queryParams['conta'];
      void this.router.navigateByUrl(url, { replaceUrl: true });
    }
  }
  clearCoupon() {
    this.reference = '';
    this.couponQuote.set(null);
    this.couponError.set('');
  }
  async applyCoupon() {
    if (this.couponBusy()) return false;
    this.couponBusy.set(true);
    this.couponError.set('');
    this.couponQuote.set(null);
    this.coupon = this.coupon.trim().toUpperCase();
    const code = this.coupon,
      subtotal = this.subtotal();
    try {
      const quote = await this.api.post('/stores/' + this.slug + '/coupon-quote', {
        coupon: code,
        subtotalInCents: subtotal,
      });
      if (code === this.coupon && subtotal === this.subtotal()) this.couponQuote.set(quote);
      return true;
    } catch (e) {
      this.couponError.set(errorMessage(e));
      return false;
    } finally {
      this.couponBusy.set(false);
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
    this.couponQuote.set(null);
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
    const quote = this.couponQuote();
    return this.has('coupons') &&
      quote &&
      quote.code === this.coupon.trim().toUpperCase() &&
      quote.subtotalInCents === this.subtotal()
      ? quote.discountInCents
      : 0;
  }
  shipping() {
    return this.fulfillment === 'delivery' ? (this.shop()?.blueprint.shippingInCents ?? 0) : 0;
  }
  total() {
    return this.subtotal() - this.discount() + this.shipping();
  }
  async checkout() {
    if (this.paying() || !this.cartCount() || this.couponBusy()) return;
    if (!this.customer()) {
      this.openAccount();
      return;
    }
    if (this.coupon.trim() && !this.reference && !(await this.applyCoupon())) return;
    this.paying.set(true);
    this.checkoutError.set('');
    try {
      this.reference ||= checkoutReference();
      const attempt = {
        reference: this.reference,
        customerId: this.customer()!.id,
        couponQuote: this.couponQuote(),
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
    } catch (e: any) {
      if (e.status === 401) {
        this.sessions.setBuyer(this.slug, null);
        this.returnToCart = this.cartOpen();
        this.cartOpen.set(false);
        this.accountOpen.set(true);
      }
      this.checkoutError.set(errorMessage(e));
    } finally {
      this.paying.set(false);
    }
  }
  async openReviews(product: Product) {
    this.reviewProduct.set(product);
    this.reviewError.set('');
    this.reviews.set([]);
    this.reviewEligibility.set('loading');
    try {
      this.reviews.set(await this.api.get('/stores/' + this.slug + '/reviews/' + product.id));
      if (this.customer()) {
        const eligibility = await this.api.get(
          '/stores/' + this.slug + '/review-eligibility/' + product.id,
        );
        this.reviewEligibility.set(eligibility.purchased ? 'allowed' : 'purchase-required');
      }
    } catch (e) {
      if ((e as any).status === 401) this.sessions.setBuyer(this.slug, null);
      this.reviewEligibility.set('error');
      this.reviewError.set(errorMessage(e));
    }
  }
  async submitReview() {
    const product = this.reviewProduct();
    if (
      !product ||
      !this.customer() ||
      this.reviewEligibility() !== 'allowed' ||
      this.reviewSaving()
    )
      return;
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
