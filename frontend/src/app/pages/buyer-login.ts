import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, errorMessage } from '../api';
import { Store } from '../models/commerce';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `<main class="container access-store-page">
    <section class="panel">
      <span class="eyebrow">SUA PRÓXIMA COMPRA COMEÇA AQUI</span>
      <h1>Entrar para comprar.</h1>
      <p>Escolha a loja em que deseja comprar para entrar ou criar sua conta de comprador.</p>
      <label
        >Endereço da loja<input
          name="buyer-store"
          [(ngModel)]="slug"
          placeholder="Ex.: minha-loja"
          maxlength="50"
      /></label>
      @if (valid()) {
        <a class="button" [routerLink]="['/loja', slug.trim()]" [queryParams]="{ conta: '1' }"
          >Entrar ou criar conta ↗</a
        >
      }
      @if (loading()) {
        <p class="muted" role="status">Carregando lojas…</p>
      } @else if (stores().length) {
        <h2 class="buyer-store-title">Ou escolha uma loja</h2>
        <div class="buyer-store-options">
          @for (store of stores(); track store.slug) {
            <a [routerLink]="['/loja', store.slug]" [queryParams]="{ conta: '1' }"
              ><strong>{{ store.name }}</strong
              ><span>Entrar como comprador ↗</span></a
            >
          }
        </div>
      } @else if (!error()) {
        <p class="muted">
          Ainda não há lojas disponíveis. <a routerLink="/">Voltar à plataforma</a>
        </p>
      }
      @if (error()) {
        <p class="notice error" role="alert">{{ error() }}</p>
        <button class="text-link" type="button" (click)="load()">Tentar novamente</button>
      }
    </section>
  </main>`,
})
export class BuyerLoginPage {
  api = inject(Api);
  stores = signal<Store[]>([]);
  loading = signal(true);
  error = signal('');
  slug = '';
  constructor() {
    void this.load();
  }
  valid() {
    return /^[a-z][a-z0-9-]{1,49}$/.test(this.slug.trim());
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      this.stores.set(await this.api.get<Store[]>('/stores'));
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
