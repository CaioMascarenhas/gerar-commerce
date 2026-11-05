import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import type { ApplicationBlueprint, Product, StockItem } from './models/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './app.html',
})
export class App {
  private readonly http = inject(HttpClient);
  readonly view = signal('loja');
  readonly blueprint = signal<ApplicationBlueprint | null>(null);
  readonly preview = signal<ApplicationBlueprint | null>(null);
  readonly products = signal<Product[]>([]);
  readonly recommendations = signal<Product[]>([]);
  readonly stock = signal<StockItem[]>([]);
  readonly services = signal<{ name: string; status: string; port?: number }[]>([]);
  readonly error = signal('');
  readonly response = signal('');
  readonly thinking = signal(false);

  constructor() {
    forkJoin({
      blueprint: this.http.get<ApplicationBlueprint>('/api/configuration'),
      products: this.http.get<Product[]>('/api/products'),
      stock: this.http.get<StockItem[]>('/api/stock'),
      services: this.http.get<{ name: string; status: string; port?: number }[]>('/api/services'),
      recommendations: this.http.get<{ products: Product[] }>('/api/recommendations/cliente-demo'),
    }).subscribe({
      next: (data) => {
        this.blueprint.set(data.blueprint);
        this.preview.set(data.blueprint);
        this.products.set(data.products);
        this.stock.set(data.stock);
        this.services.set(data.services);
        this.recommendations.set(data.recommendations.products);
      },
      error: () =>
        this.error.set(
          'Não foi possível carregar os serviços. Confira se o backend está em execução.',
        ),
    });
  }

  available(id: string): number {
    return this.stock().find((item) => item.productId === id)?.available ?? 0;
  }
  hasAssistant(): boolean {
    return this.blueprint()?.configuration.features.includes('aiAssistant') ?? false;
  }
  selectProfile(profile: string): void {
    this.http.get<ApplicationBlueprint>('/api/derivations/' + profile).subscribe({
      next: (blueprint) => this.preview.set(blueprint),
      error: () => this.error.set('Não foi possível validar o perfil.'),
    });
  }
  ask(question: string): void {
    if (!question.trim() || this.thinking()) return;
    this.thinking.set(true);
    this.response.set('');
    this.http
      .post<{ text: string }>(
        '/api/assistant/query',
        { message: question },
        { headers: { 'x-demo-admin': 'gerar-demo' } },
      )
      .subscribe({
        next: (result) => {
          this.response.set(result.text);
          this.thinking.set(false);
        },
        error: (error) => {
          this.response.set(error.error?.message ?? 'O assistente está indisponível.');
          this.thinking.set(false);
        },
      });
  }
}
