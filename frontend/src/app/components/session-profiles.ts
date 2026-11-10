import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd, PRIMARY_OUTLET } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { StoreSessions } from '../sessions';
import { errorMessage } from '../api';

@Component({
  selector: 'session-profiles',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (visible()) {
      @if (sessions.activeSlug(); as slug) {
        @let profile = sessions.profile(slug);
        @if (profile.admin || profile.buyer) {
          <aside class="session-profiles" aria-label="Perfis conectados" aria-live="polite">
            @if (profile.admin) {
              <div class="session-profile owner-profile">
                <span class="session-dot" aria-hidden="true"></span>
                <div>
                  <small>Perfil da loja conectado</small><strong>{{ profile.name }}</strong>
                </div>
                <a class="text-link" [routerLink]="['/admin', slug]">Painel da loja</a>
                <button
                  class="session-signout"
                  type="button"
                  (click)="logout('admin', slug)"
                  [disabled]="!!busy()"
                >
                  {{ busy() === 'admin' ? 'Saindo…' : 'Sair da loja' }}
                </button>
              </div>
            }
            @if (profile.buyer; as buyer) {
              <div class="session-profile customer-profile">
                <span class="session-dot" aria-hidden="true"></span>
                <div>
                  <small>Comprador conectado · {{ profile.name }}</small
                  ><strong>{{ buyer.name }}</strong
                  ><span>{{ buyer.email }}</span>
                </div>
                <a class="text-link" [routerLink]="['/loja', slug]">Ver loja</a>
                <button
                  class="session-signout"
                  type="button"
                  (click)="logout('buyer', slug)"
                  [disabled]="!!busy()"
                >
                  {{ busy() === 'buyer' ? 'Saindo…' : 'Sair do comprador' }}
                </button>
              </div>
            }
          </aside>
        }
        @if (error()) {
          <p class="session-error" role="alert">{{ error() }}</p>
        }
      }
    }
  `,
})
export class SessionProfiles {
  visible = input(true);
  sessions = inject(StoreSessions);
  router = inject(Router);
  busy = signal('');
  error = signal('');
  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => void this.sync());
    void this.sync();
  }
  async sync() {
    const segments =
      this.router.parseUrl(this.router.url).root.children[PRIMARY_OUTLET]?.segments ?? [];
    const slug = ['loja', 'admin'].includes(segments[0]?.path)
      ? segments[1]?.path
      : this.sessions.activeSlug() ||
        localStorage.getItem('gerar-session-store') ||
        localStorage.getItem('gerar-my-store');
    this.error.set('');
    if (!slug || !/^[a-z][a-z0-9-]{1,49}$/.test(slug)) return;
    this.sessions.activeSlug.set(slug);
    try {
      await this.sessions.refresh(slug);
    } catch (error: any) {
      if (error.status !== 404 && this.sessions.activeSlug() === slug)
        this.error.set(
          'Não foi possível verificar os perfis conectados. Atualize a página para tentar novamente.',
        );
    }
  }
  async logout(role: 'admin' | 'buyer', slug: string) {
    if (this.busy()) return;
    this.busy.set(role);
    this.error.set('');
    try {
      if (role === 'admin') await this.sessions.logoutAdmin(slug);
      else await this.sessions.logoutBuyer(slug);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set('');
    }
  }
}
