import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, errorMessage, readImage } from '../api';
import {
  Feature,
  Store,
  categoryList,
  newProduct,
  newStore,
  plan,
  slugify,
} from '../models/commerce';
import { FeaturePicker } from '../components/features';
@Component({
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink, FeaturePicker],
  template: `
    <main class="container builder-page">
      @if (created(); as shop) {
        <section class="creation-success">
          <div class="success-orbit">✓</div>
          <span class="eyebrow">UMA IDEIA QUE GANHOU ENDEREÇO</span>
          <h1>{{ shop.name }}<br /><span>está de portas abertas.</span></h1>
          <p>Sua loja foi criada. Agora é hora de dar o próximo passo.</p>
          <div class="address-box">{{ origin }}/loja/{{ shop.slug }}</div>
          <div class="hero-actions">
            <a class="button" [routerLink]="['/loja', shop.slug]">Visitar minha loja ↗</a
            ><a class="button secondary" [routerLink]="['/admin', shop.slug]">Administrar loja</a>
          </div>
          <p class="muted">Use a senha que você cadastrou para acessar o painel.</p>
        </section>
      } @else {
        <a class="back-link" routerLink="/">← Voltar para a plataforma</a>
        <div class="page-title">
          <span class="eyebrow">DO SEU JEITO, DESDE O COMEÇO</span>
          <h1>Vamos gerar sua loja.</h1>
          <p>Uma boa ideia, algumas escolhas e um novo endereço para o seu negócio.</p>
        </div>
        <div class="builder-layout">
          <div>
            <div class="stepper" aria-label="Etapas do cadastro">
              @for (label of steps; track label; let i = $index) {
                <button [class.active]="step() === i" [class.done]="step() > i" (click)="goStep(i)">
                  <b>{{ step() > i ? '✓' : i + 1 }}</b
                  ><span>{{ label }}</span>
                </button>
              }
            </div>
            @if (error()) {
              <div class="notice error" role="alert">{{ error() }}</div>
            }
            @if (message()) {
              <div class="notice" role="status">{{ message() }}</div>
            }
            <form (ngSubmit)="next()" class="builder-form">
              @if (step() === 0) {
                <section class="panel">
                  <div class="panel-title">
                    <span class="step-label">01</span>
                    <div>
                      <h2>A identidade da sua loja.</h2>
                      <p>Conte um pouco sobre o que você quer criar.</p>
                    </div>
                  </div>
                  <label
                    >Nome da loja<input
                      name="name"
                      [(ngModel)]="draft.name"
                      (ngModelChange)="nameChanged()"
                      maxlength="80"
                      placeholder="Ex.: Aurora Studio"
                      required
                      minlength="2"
                  /></label>
                  <label
                    >Endereço da loja
                    <div class="input-prefix">
                      <span>/loja/</span
                      ><input
                        name="slug"
                        [(ngModel)]="draft.slug"
                        (input)="slugEdited = true"
                        pattern="[a-z][a-z0-9-]{1,49}"
                        placeholder="aurora-studio"
                        required
                      />
                    </div>
                    <small
                      >Esse será o endereço público da sua loja. Escolha com cuidado.</small
                    ></label
                  >
                  <label
                    >Descrição<textarea
                      name="description"
                      [(ngModel)]="draft.description"
                      maxlength="600"
                      placeholder="O que torna a sua loja especial?"
                      required
                    ></textarea>
                  </label>
                  <label>Categoria da loja</label>
                  <div class="category-options">
                    @for (category of categories; track category.id) {
                      <button
                        type="button"
                        [class.selected]="draft.category === category.id"
                        (click)="draft.category = category.id"
                        [style.--accent]="category.color"
                      >
                        <span>{{ category.icon }}</span
                        ><strong>{{ category.name }}</strong
                        ><small>{{
                          draft.category === category.id ? 'Selecionada' : 'Escolher estilo'
                        }}</small>
                      </button>
                    }
                  </div>
                  <label>Foto de capa</label
                  ><label class="upload-area" for="cover">
                    @if (draft.cover) {
                      <img [src]="draft.cover" alt="Prévia da capa da loja" /><span
                        >Trocar imagem ↗</span
                      >
                    } @else {
                      <b>↥</b><strong>Uma imagem para dar boas-vindas.</strong
                      ><span>Clique para escolher · JPG, PNG ou WebP · até 2 MB</span>
                    }
                    <input
                      id="cover"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      (change)="upload($event)"
                      class="file-input"
                  /></label>
                  <label class="muted"
                    >Ou use o endereço de uma imagem<input
                      type="url"
                      name="coverUrl"
                      [ngModel]="draft.cover.startsWith('https://') ? draft.cover : ''"
                      (ngModelChange)="draft.cover = $event"
                      placeholder="https://…"
                  /></label>
                  <label
                    >Senha de administração<input
                      type="password"
                      name="password"
                      [(ngModel)]="draft.password"
                      minlength="6"
                      maxlength="128"
                      autocomplete="new-password"
                      placeholder="Crie uma senha com pelo menos 6 caracteres"
                      required
                    /><small
                      >Você usará essa senha em /admin/{{ draft.slug || 'sua-loja' }}.</small
                    ></label
                  >
                </section>
              }
              @if (step() === 1) {
                <section class="panel">
                  <div class="panel-title">
                    <span class="step-label">02</span>
                    <div>
                      <h2>Combine possibilidades.</h2>
                      <p>O framework monta sua loja com as funcionalidades escolhidas.</p>
                    </div>
                  </div>
                  @if (features().length) {
                    <feature-picker [features]="features()" [options]="draft.options" />
                  } @else {
                    <div class="notice error">
                      Não foi possível carregar as funcionalidades.
                      <button type="button" (click)="loadFeatures()">Tentar novamente</button>
                    </div>
                  }
                </section>
              }
              @if (step() === 2) {
                <section class="panel">
                  <div class="panel-title">
                    <span class="step-label">03</span>
                    <div>
                      <h2>Os primeiros da sua coleção.</h2>
                      <p>Sua loja precisa de pelo menos um produto para abrir.</p>
                    </div>
                  </div>
                  <div class="ai-callout">
                    <div>
                      <span class="ai-badge">✦ IA</span><strong>Uma ajuda para começar.</strong>
                      <p>Gere três produtos da sua categoria e personalize os detalhes.</p>
                    </div>
                    <button
                      class="button secondary"
                      type="button"
                      [disabled]="generating() || draft.products.length > 27"
                      (click)="generate()"
                    >
                      {{ generating() ? 'Gerando…' : '✦ Gerar 3 produtos com IA' }}
                    </button>
                  </div>
                  @for (product of draft.products; track $index; let i = $index) {
                    <div class="draft-product">
                      <div class="product-editor-heading">
                        <span class="pill">Produto {{ i + 1 }}</span
                        ><button
                          class="text-link danger"
                          type="button"
                          (click)="draft.products.splice(i, 1)"
                        >
                          Remover
                        </button>
                      </div>
                      <label
                        >Nome<input
                          [name]="'product-name-' + i"
                          [(ngModel)]="product.name"
                          maxlength="100"
                          placeholder="Nome do produto"
                          required /></label
                      ><label
                        >Descrição<textarea
                          [name]="'product-desc-' + i"
                          [(ngModel)]="product.description"
                          maxlength="600"
                          placeholder="Conte os detalhes do produto"
                          required
                        ></textarea>
                      </label>
                      <div class="form-row">
                        <label
                          >Preço (R$)<input
                            type="number"
                            [name]="'product-price-' + i"
                            [ngModel]="product.priceInCents / 100"
                            (ngModelChange)="product.priceInCents = cents($event)"
                            min="0.01"
                            max="1000000"
                            step="0.01"
                            required /></label
                        ><label
                          >Estoque inicial<input
                            type="number"
                            [name]="'product-stock-' + i"
                            [(ngModel)]="product.stock"
                            min="0"
                            max="1000000"
                            step="1"
                            required
                        /></label>
                      </div>
                      <label
                        >Imagem do produto <small>Opcional · URL HTTPS</small
                        ><input
                          type="url"
                          [name]="'product-image-' + i"
                          [(ngModel)]="product.image"
                          placeholder="https://…"
                      /></label>
                    </div>
                  }
                  <button
                    class="button secondary wide"
                    type="button"
                    (click)="addProduct()"
                    [disabled]="draft.products.length >= 30"
                  >
                    ＋ Adicionar produto manualmente
                  </button>
                  <div class="notice">
                    Ao criar, sua loja será publicada nesta plataforma. Os planos e pagamentos são
                    fictícios, sem cobrança real.
                  </div>
                </section>
              }
              <div class="form-navigation">
                @if (step() > 0) {
                  <button type="button" class="button secondary" (click)="step.set(step() - 1)">
                    ← Voltar
                  </button>
                } @else {
                  <span></span>
                }
                <button class="button" type="submit" [disabled]="saving() || !features().length">
                  {{
                    saving()
                      ? 'Criando sua loja…'
                      : step() === 2
                        ? 'Criar minha loja ↗'
                        : 'Continuar →'
                  }}
                </button>
              </div>
            </form>
          </div>
          <aside class="builder-summary">
            <div class="summary-eyebrow">SUA LOJA ESTÁ GANHANDO FORMA</div>
            <div class="preview-card" [style.--accent]="theme().color">
              <div class="preview-cover">
                @if (draft.cover) {
                  <img [src]="draft.cover" alt="Prévia da capa" />
                } @else {
                  <span>{{ theme().icon }}</span>
                }
              </div>
              <div class="preview-content">
                <span class="pill">{{ theme().name }}</span>
                <h3>{{ draft.name || 'O nome da sua loja' }}</h3>
                <p>{{ draft.description || 'Uma nova história começa com a sua ideia.' }}</p>
                <small>/loja/{{ draft.slug || 'sua-loja' }}</small>
              </div>
            </div>
            <div class="summary-plan">
              <span>Seu plano</span><strong>{{ currentPlan().name }}</strong>
              <div class="plan-price">
                {{ currentPlan().price / 100 | currency: 'BRL' }}<small>/mês</small>
              </div>
              <div class="summary-line"><span>Funcionalidades core</span><b>7 incluídas</b></div>
              <div class="summary-line">
                <span>Opcionais selecionados</span><b>{{ draft.options.length }}</b>
              </div>
              <div class="summary-line">
                <span>Produtos</span><b>{{ draft.products.length }}</b>
              </div>
            </div>
            <p class="summary-note">
              ✧ Sua seleção é validada e montada pelo framework Gerar Commerce.
            </p>
            <p class="muted">Demonstração acadêmica. Nenhuma cobrança será realizada.</p>
          </aside>
        </div>
      }
    </main>
  `,
})
export class BuilderPage {
  api = inject(Api);
  draft = newStore();
  step = signal(0);
  features = signal<Feature[]>([]);
  error = signal('');
  message = signal('');
  saving = signal(false);
  generating = signal(false);
  created = signal<Store | null>(null);
  categories = categoryList;
  steps = ['Sua identidade', 'Funcionalidades', 'Seus produtos'];
  slugEdited = false;
  origin = location.origin;
  constructor() {
    void this.loadFeatures();
  }
  async loadFeatures() {
    try {
      this.features.set((await this.api.get('/features')).features);
      this.error.set('');
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
  currentPlan() {
    return plan(this.draft.options);
  }
  theme() {
    return this.categories.find((c) => c.id === this.draft.category)!;
  }
  nameChanged() {
    if (!this.slugEdited) this.draft.slug = slugify(this.draft.name);
  }
  cents(value: number) {
    return Math.round(Number(value) * 100);
  }
  async upload(event: Event) {
    try {
      const value = await readImage(event);
      if (value) this.draft.cover = value;
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
  validIdentity() {
    if (
      this.draft.name.trim().length < 2 ||
      !/^[a-z][a-z0-9-]{1,49}$/.test(this.draft.slug) ||
      !this.draft.description.trim() ||
      !this.draft.cover ||
      this.draft.password.trim().length < 6
    ) {
      this.error.set(
        'Preencha nome, endereço válido, descrição, foto de capa e senha de pelo menos 6 caracteres.',
      );
      return false;
    }
    return true;
  }
  goStep(index: number) {
    this.error.set('');
    if (index > 0 && !this.validIdentity()) return;
    this.step.set(index);
  }
  addProduct() {
    if (this.draft.products.length < 30) this.draft.products.push(newProduct());
  }
  async generate() {
    this.generating.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const result = await this.api.post('/generate-products', {
        name: this.draft.name,
        category: this.draft.category,
      });
      this.draft.products = this.draft.products
        .filter((p) => p.name.trim() || p.description.trim())
        .concat(result.products);
      this.message.set(result.message);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.generating.set(false);
    }
  }
  async next() {
    this.error.set('');
    if (!this.validIdentity()) {
      this.step.set(0);
      return;
    }
    if (this.step() < 2) {
      this.step.set(this.step() + 1);
      return;
    }
    if (!this.draft.products.length) {
      this.error.set('Adicione pelo menos um produto para criar sua loja.');
      return;
    }
    this.saving.set(true);
    try {
      this.created.set(await this.api.post<Store>('/stores', this.draft));
      window.scrollTo(0, 0);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
}
