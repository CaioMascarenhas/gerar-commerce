import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet, PRIMARY_OUTLET } from '@angular/router';
import { SessionProfiles } from './components/session-profiles';
import { StoreSessions } from './sessions';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet, SessionProfiles],
  template: `
    <header class="platform-header">
      <a class="brand" routerLink="/"
        ><span class="brand-icon">g<span>↗</span></span
        >gerar<span class="brand-light">commerce</span></a
      >
      <nav aria-label="Menu principal">
        <a routerLink="/">Explorar lojas</a><a routerLink="/minha-loja">Acessar minha loja</a
        ><button
          class="button secondary small header-buyer-login"
          type="button"
          (click)="openBuyerAccount()"
        >
          {{
            sessions.profile(sessions.activeSlug()).buyer ? 'Minha conta' : 'Entrar para comprar'
          }}</button
        ><a class="button small" routerLink="/criar">Criar minha loja <span>↗</span></a>
      </nav>
    </header>
    <session-profiles />
    <router-outlet />
    <footer class="platform-footer">
      <a class="brand" routerLink="/">gerar<span class="brand-light">commerce</span></a
      ><span>Um framework. Infinitas possibilidades.</span
      ><span>Projeto acadêmico · UFAL · Planos e pagamentos fictícios</span>
    </footer>
  `,
})
export class App {
  sessions = inject(StoreSessions);
  router = inject(Router);
  openBuyerAccount() {
    const url = this.router.parseUrl(this.router.url);
    const segments = url.root.children[PRIMARY_OUTLET]?.segments ?? [];
    if (segments[0]?.path === 'loja') {
      url.queryParams = { ...url.queryParams, conta: '1' };
      void this.router.navigateByUrl(url);
    } else if (this.sessions.activeSlug()) {
      void this.router.navigate(['/loja', this.sessions.activeSlug()], {
        queryParams: { conta: '1' },
      });
    } else void this.router.navigate(['/entrar']);
  }
}
