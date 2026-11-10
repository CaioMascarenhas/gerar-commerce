import { Component, input, signal, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api, errorMessage } from '../api';
interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  products?: { id: string; name: string; priceInCents: number; url: string }[];
}
@Component({
  selector: 'shopping-chat',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe],
  template: `
    <button
      class="chat-fab"
      type="button"
      (click)="opened.set(!opened())"
      [attr.aria-expanded]="opened()"
      aria-controls="shopping-chat"
      aria-label="Abrir chat de produtos com IA"
    >
      <span class="live-dot"></span>✦ Dicas com IA
    </button>
    @if (opened()) {
      <section
        class="shopping-chat"
        id="shopping-chat"
        role="dialog"
        aria-label="Consultor de produtos com Gemini"
        (keydown.escape)="opened.set(false)"
        animate.enter="chat-enter"
        animate.leave="chat-leave"
      >
        <div class="drawer-header">
          <div>
            <strong>✦ Vamos escolher juntos?</strong><small>Consultor de produtos · Gemini</small>
          </div>
          <button
            class="icon-button"
            type="button"
            (click)="opened.set(false)"
            aria-label="Fechar chat"
          >
            ×
          </button>
        </div>
        <div class="chat-messages" aria-live="polite" #messagesBox>
          <p class="chat-intro">
            Conte o que procura e seu orçamento. Posso comparar os produtos desta loja e mostrar os
            links para você.
          </p>
          @for (message of messages(); track $index) {
            <article class="chat-message" [class.from-buyer]="message.role === 'user'">
              <small>{{ message.role === 'user' ? 'Você' : 'Consultor IA' }}</small>
              <p>{{ message.text }}</p>
              @for (product of message.products || []; track product.id) {
                <a class="chat-product-link" [routerLink]="product.url" (click)="opened.set(false)"
                  >{{ product.name
                  }}<strong>{{ product.priceInCents / 100 | currency: 'BRL' }} ↗</strong></a
                >
              }
            </article>
          }
          @if (busy()) {
            <p class="muted" role="status">Consultando o catálogo…</p>
          }
          @if (error()) {
            <p class="notice error" role="alert">{{ error() }}</p>
          }
        </div>
        <form class="chat-form" (ngSubmit)="send(messagesBox)">
          <label class="sr-only" for="shopping-question">Sua mensagem</label
          ><input
            id="shopping-question"
            name="shopping-question"
            [(ngModel)]="question"
            placeholder="Ex.: um presente até R$ 200"
            maxlength="1500"
            required
            [disabled]="busy()"
          /><button type="submit" class="button small" [disabled]="busy() || !question.trim()">
            Enviar
          </button>
        </form>
        <small class="chat-disclaimer"
          >A IA pode errar. Confira preço e disponibilidade no produto.</small
        >
      </section>
    }
  `,
})
export class ShoppingChat {
  api = inject(Api);
  slug = input.required<string>();
  opened = signal(false);
  busy = signal(false);
  error = signal('');
  question = '';
  messages = signal<ChatMessage[]>([]);
  private generation = 0;
  constructor() {
    effect(() => {
      this.slug();
      this.generation++;
      this.messages.set([]);
      this.error.set('');
      this.opened.set(false);
      this.busy.set(false);
    });
  }
  async send(box: HTMLElement) {
    if (this.busy() || !this.question.trim()) return;
    const requestGeneration = this.generation;
    const message = this.question.trim();
    const history = this.messages()
      .slice(-6)
      .map(({ role, text }) => ({ role, text }));
    this.question = '';
    this.error.set('');
    this.busy.set(true);
    this.messages.update((messages) => [...messages, { role: 'user', text: message }]);
    setTimeout(() => (box.scrollTop = box.scrollHeight));
    try {
      const result = await this.api.post('/stores/' + this.slug() + '/chat', { message, history });
      if (requestGeneration === this.generation)
        this.messages.update((messages) => [
          ...messages,
          { role: 'assistant', text: result.text, products: result.products },
        ]);
    } catch (e) {
      if (requestGeneration === this.generation) {
        this.error.set(errorMessage(e));
        this.question = message;
      }
    } finally {
      if (requestGeneration === this.generation) {
        this.busy.set(false);
        setTimeout(() => (box.scrollTop = box.scrollHeight));
      }
    }
  }
}
