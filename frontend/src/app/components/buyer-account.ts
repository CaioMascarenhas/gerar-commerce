import { DialogFocus } from './dialog-focus';
import { Component, input, output, signal, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Api, errorMessage } from '../api';
import { Customer, Order } from '../models/commerce';
@Component({
  selector: 'buyer-account',
  standalone: true,
  imports: [DialogFocus, FormsModule, CurrencyPipe, DatePipe],
  template: `
    @if (opened()) {
      <div class="modal-backdrop" (click)="!busy() && closed.emit()"></div>
      <section
        class="dialog buyer-dialog"
        dialogFocus
        role="dialog"
        aria-modal="true"
        aria-labelledby="buyer-title"
        (keydown.escape)="!busy() && closed.emit()"
      >
        <div class="drawer-header">
          <h2 id="buyer-title">{{ customer() ? 'Minha conta' : 'Sua conta de comprador' }}</h2>
          <button
            type="button"
            class="icon-button"
            aria-label="Fechar conta"
            [disabled]="busy()"
            (click)="closed.emit()"
          >
            ×
          </button>
        </div>
        @if (storeName()) {
          <p class="muted">
            Conta de comprador em <strong>{{ storeName() }}</strong
            >.
          </p>
        }
        @if (customer(); as person) {
          <p>
            Olá, <strong>{{ person.name }}</strong
            >!<br /><span class="muted">{{ person.email }}</span>
          </p>
          <h3>Meus pedidos</h3>
          @if (loadingOrders()) {
            <p role="status">Carregando pedidos…</p>
          }
          @for (order of orders(); track order.id) {
            <article class="buyer-order">
              <strong
                >#{{ order.id.slice(0, 8) }} ·
                {{ order.totalInCents / 100 | currency: 'BRL' }}</strong
              ><small
                >{{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }} ·
                {{ order.status === 'paid' ? 'Aprovado' : 'Recusado' }}</small
              >
              @for (item of order.items; track item.productId) {
                <p>{{ item.quantity }} × {{ item.name }}</p>
              }
            </article>
          } @empty {
            @if (!loadingOrders()) {
              <p class="muted">Você ainda não tem pedidos nesta loja.</p>
            }
          }
          <button class="button secondary" type="button" (click)="logout()" [disabled]="busy()">
            Sair da conta
          </button>
        } @else {
          <p>
            Explore e monte sua sacola à vontade. Para finalizar, entre ou crie sua conta nesta
            loja.
          </p>
          <div class="tabs">
            <button
              type="button"
              [class.active]="!register()"
              (click)="register.set(false); error.set('')"
            >
              Entrar</button
            ><button
              type="button"
              [class.active]="register()"
              (click)="register.set(true); error.set('')"
            >
              Criar conta
            </button>
          </div>
          <form (ngSubmit)="submit()">
            @if (register()) {
              <label
                >Seu nome<input
                  name="buyer-name"
                  data-dialog-autofocus
                  [(ngModel)]="name"
                  autocomplete="name"
                  required
                  minlength="2"
                  maxlength="80"
              /></label>
            }
            <label
              >E-mail<input
                name="buyer-email"
                data-dialog-autofocus
                type="email"
                [(ngModel)]="email"
                autocomplete="email"
                required
                maxlength="254"
            /></label>
            <label
              >Senha<input
                name="buyer-password"
                type="password"
                [(ngModel)]="password"
                [attr.autocomplete]="register() ? 'new-password' : 'current-password'"
                required
                minlength="8"
                maxlength="128"
              /><small>Use pelo menos 8 caracteres.</small></label
            >
            <button class="button wide" [disabled]="busy()">
              {{
                busy() ? 'Aguarde…' : register() ? 'Criar conta e entrar' : 'Entrar na minha conta'
              }}
            </button>
          </form>
        }
        @if (error()) {
          <p class="notice error" role="alert">{{ error() }}</p>
        }
      </section>
    }
  `,
})
export class BuyerAccount {
  api = inject(Api);
  slug = input.required<string>();
  storeName = input('');
  opened = input(false);
  customer = input<Customer | null>(null);
  closed = output<void>();
  customerChange = output<Customer | null>();
  register = signal(false);
  busy = signal(false);
  error = signal('');
  orders = signal<Order[]>([]);
  loadingOrders = signal(false);
  name = '';
  email = '';
  password = '';
  constructor() {
    effect(() => {
      if (this.opened() && this.customer()) void this.loadOrders();
    });
  }
  async loadOrders() {
    this.loadingOrders.set(true);
    this.error.set('');
    try {
      this.orders.set(await this.api.get('/stores/' + this.slug() + '/customer-orders'));
    } catch (e: any) {
      this.error.set(errorMessage(e));
      if (e.status === 401) this.customerChange.emit(null);
    } finally {
      this.loadingOrders.set(false);
    }
  }
  async submit() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const customer = await this.api.post<Customer>(
        '/stores/' + this.slug() + (this.register() ? '/customers' : '/customer-login'),
        { name: this.name, email: this.email, password: this.password },
      );
      this.password = '';
      this.customerChange.emit(customer);
      this.closed.emit();
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async logout() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.post('/stores/' + this.slug() + '/customer-logout', {});
      this.customerChange.emit(null);
      this.orders.set([]);
      this.closed.emit();
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
