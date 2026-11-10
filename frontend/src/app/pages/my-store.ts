import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `<main class="container access-store-page">
    <section class="panel">
      <span class="eyebrow">SEU NEGÓCIO, A UM CLIQUE</span>
      <h1>Acessar minha loja.</h1>
      <p>
        Informe o endereço escolhido no cadastro. Você usará a senha da loja para entrar no painel.
      </p>
      <label
        >Endereço da loja
        <div class="input-prefix">
          <span>/loja/</span
          ><input
            name="my-store-slug"
            [(ngModel)]="slug"
            placeholder="minha-loja"
            maxlength="50"
          /></div
      ></label>
      @if (valid()) {
        <div class="hero-actions">
          <a class="button" [routerLink]="['/admin', slug.trim()]" (click)="remember()"
            >Entrar no painel ↗</a
          ><a class="button secondary" [routerLink]="['/loja', slug.trim()]" (click)="remember()"
            >Visitar minha loja</a
          >
        </div>
      } @else {
        <p class="muted">Use o endereço com letras minúsculas, números e hífens.</p>
      }
      <p class="muted">
        {{
          remembered
            ? 'Preenchemos o último endereço usado neste navegador.'
            : 'Ainda não tem uma loja?'
        }}
        <a routerLink="/criar">Criar minha loja</a>
      </p>
    </section>
  </main>`,
})
export class MyStorePage {
  slug = localStorage.getItem('gerar-my-store') ?? '';
  remembered = !!this.slug;
  valid() {
    return /^[a-z][a-z0-9-]{1,49}$/.test(this.slug.trim());
  }
  remember() {
    localStorage.setItem('gerar-my-store', this.slug.trim());
  }
}
