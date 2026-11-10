import { test, afterEach, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { DialogFocus } from '../src/app/components/dialog-focus';
import { BuyerAccount } from '../src/app/components/buyer-account';
import { StoreSessions } from '../src/app/sessions';
import { SessionProfiles } from '../src/app/components/session-profiles';
import { StorePage } from '../src/app/pages/store';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Api } from '../src/app/api';

before(() => TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting()));
afterEach(() => {
  TestBed.resetTestingModule();
  document.body.replaceChildren();
  document.head.replaceChildren();
  localStorage.clear();
});

const buyer = { id: 'comprador-1', name: 'Comprador de teste', email: 'cliente@example.test' };

@Component({
  standalone: true,
  imports: [DialogFocus, BuyerAccount],
  template: `
    <button id="opener">Abrir sacola</button>
    @if (cart()) {
      <section id="cart" dialogFocus role="dialog" aria-modal="true">
        <button>Finalizar compra</button>
      </section>
    }
    <buyer-account slug="minha-loja" [opened]="login()" (closed)="login.set(false)" />
  `,
})
class DialogHarness {
  cart = signal(true);
  login = signal(false);
}

test('login fica acima do próprio fundo, mesmo com a regra geral de diálogo posterior', async () => {
  TestBed.configureTestingModule({
    imports: [BuyerAccount],
    providers: [{ provide: Api, useValue: {} }],
  });
  const style = document.createElement('style');
  style.textContent = readFileSync('src/styles.css', 'utf8');
  document.head.append(style);
  const fixture = TestBed.createComponent(BuyerAccount);
  document.body.append(fixture.nativeElement);
  fixture.componentRef.setInput('slug', 'minha-loja');
  fixture.componentRef.setInput('opened', true);
  fixture.detectChanges();
  await Promise.resolve();
  const dialog = fixture.nativeElement.querySelector('.buyer-dialog');
  const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
  assert(
    Number(getComputedStyle(dialog).zIndex) > Number(getComputedStyle(backdrop).zIndex),
    'O fundo não pode cobrir ou desfocar o formulário.',
  );
  assert.equal((document.activeElement as HTMLInputElement).name, 'buyer-email');
});

test('saída do painel anterior preserva foco e bloqueio de rolagem do login', async () => {
  TestBed.configureTestingModule({
    imports: [DialogHarness],
    providers: [{ provide: Api, useValue: {} }],
  });
  document.body.style.overflow = 'auto';
  const fixture = TestBed.createComponent(DialogHarness);
  document.body.append(fixture.nativeElement);
  fixture.detectChanges();
  await Promise.resolve();
  fixture.componentInstance.login.set(true);
  fixture.detectChanges();
  await Promise.resolve();
  assert.equal(fixture.nativeElement.querySelector('#cart').inert, true);
  const email = fixture.nativeElement.querySelector('input[name="buyer-email"]');
  assert.equal(document.activeElement, email);
  // Simula o fim da animação da sacola depois de o login já estar aberto.
  fixture.componentInstance.cart.set(false);
  fixture.detectChanges();
  assert.equal(document.activeElement, email);
  assert.equal(document.body.style.overflow, 'hidden');
  fixture.nativeElement.querySelector('#opener').focus();
  assert.equal(
    document.activeElement,
    email,
    'O foco não pode escapar para a página por trás do login.',
  );
  const dialog = fixture.nativeElement.querySelector('.buyer-dialog');
  const buttons = dialog.querySelectorAll('button');
  buttons[buttons.length - 1].focus();
  buttons[buttons.length - 1].dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
  );
  assert.equal(document.activeElement, buttons[0], 'Tab permanece no diálogo ativo.');
  fixture.componentInstance.login.set(false);
  fixture.detectChanges();
  assert.equal(document.body.style.overflow, 'auto');
});

test('checkout abre somente a conta e reabre a sacola com os itens após fechar o login', async () => {
  const profiles = new StoreSessionsMock();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: Api, useValue: { get: () => Promise.resolve({ products: [] }) } },
      { provide: StoreSessions, useValue: profiles },
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap({ slug: 'minha-loja' })),
          queryParamMap: of(convertToParamMap({})),
        },
      },
    ],
  });
  const page = TestBed.runInInjectionContext(() => new StorePage());
  page.loading.set(false);
  page.products.set([
    {
      id: 'produto-1',
      name: 'Produto',
      description: 'Teste',
      priceInCents: 1000,
      image: '',
      category: 'roupas',
    },
  ]);
  page.stock.set([{ productId: 'produto-1', available: 5 }]);
  page.cart.set({ 'produto-1': 2 });
  page.cartOpen.set(true);
  await page.checkout();
  assert.equal(page.accountOpen(), true);
  assert.equal(page.cartOpen(), false);
  assert.equal(page.cartCount(), 2);
  page.buyerChanged(buyer);
  page.closeAccount();
  assert.equal(page.accountOpen(), false);
  assert.equal(page.cartOpen(), true);
  assert.equal(page.cartCount(), 2);
});

class StoreSessionsMock {
  private state = signal<{ name: string; admin: boolean; buyer: typeof buyer | null }>({
    name: 'Minha loja',
    admin: false,
    buyer: null,
  });
  profile = () => this.state();
  refresh = () => new Promise(() => {});
  setBuyer(_slug: string, customer: typeof buyer | null) {
    this.state.update((profile) => ({ ...profile, buyer: customer }));
  }
}

test('logout de um perfil não altera a sessão do outro', async () => {
  const paths: string[] = [];
  TestBed.configureTestingModule({
    providers: [
      {
        provide: Api,
        useValue: {
          post: async (path: string) => {
            paths.push(path);
            return {};
          },
        },
      },
    ],
  });
  const sessions = TestBed.inject(StoreSessions);
  sessions.setAdmin('minha-loja', true);
  sessions.setBuyer('minha-loja', buyer);
  await sessions.logoutAdmin('minha-loja');
  assert.equal(sessions.profile('minha-loja').admin, false);
  assert.deepEqual(sessions.profile('minha-loja').buyer, buyer);
  sessions.setAdmin('minha-loja', true);
  await sessions.logoutBuyer('minha-loja');
  assert.equal(sessions.profile('minha-loja').admin, true);
  assert.equal(sessions.profile('minha-loja').buyer, null);
  assert.deepEqual(paths, ['/stores/minha-loja/logout', '/stores/minha-loja/customer-logout']);
});

test('consulta antiga não reativa perfis que acabaram de sair', async () => {
  let resolveAdmin!: (value: unknown) => void, resolveBuyer!: (value: unknown) => void;
  TestBed.configureTestingModule({
    providers: [
      {
        provide: Api,
        useValue: {
          get: (path: string) => {
            if (path.endsWith('/customer-session'))
              return new Promise((resolve) => (resolveBuyer = resolve));
            if (path.endsWith('/session'))
              return new Promise((resolve) => (resolveAdmin = resolve));
            return Promise.resolve({ name: 'Minha loja' });
          },
        },
      },
    ],
  });
  const sessions = TestBed.inject(StoreSessions);
  const pending = sessions.refresh('minha-loja');
  sessions.setAdmin('minha-loja', false);
  sessions.setBuyer('minha-loja', null);
  resolveAdmin({ authenticated: true });
  resolveBuyer(buyer);
  await pending;
  assert.equal(sessions.profile('minha-loja').admin, false);
  assert.equal(sessions.profile('minha-loja').buyer, null);
});

test('cabeçalho mostra os dois perfis e permite sair de cada um separadamente', async () => {
  TestBed.configureTestingModule({
    imports: [SessionProfiles],
    providers: [
      provideRouter([]),
      {
        provide: Api,
        useValue: {
          get: async (path: string) =>
            path.endsWith('/customer-session')
              ? buyer
              : path.endsWith('/session')
                ? { authenticated: true }
                : { name: 'Minha loja' },
          post: async () => ({}),
        },
      },
    ],
  });
  const sessions = TestBed.inject(StoreSessions);
  sessions.activeSlug.set('minha-loja');
  const fixture = TestBed.createComponent(SessionProfiles);
  document.body.append(fixture.nativeElement);
  await sessions.refresh('minha-loja');
  fixture.detectChanges();
  assert.match(fixture.nativeElement.textContent, /Perfil da loja conectado/);
  assert.match(fixture.nativeElement.textContent, /Comprador conectado/);
  assert.match(fixture.nativeElement.textContent, /Comprador de teste/);
  fixture.nativeElement.querySelector('.owner-profile button').click();
  await fixture.whenStable();
  fixture.detectChanges();
  assert.equal(fixture.nativeElement.querySelector('.owner-profile'), null);
  assert(fixture.nativeElement.querySelector('.customer-profile'));
  fixture.nativeElement.querySelector('.customer-profile button').click();
  await fixture.whenStable();
  fixture.detectChanges();
  assert.equal(fixture.nativeElement.querySelector('.session-profiles'), null);
});
