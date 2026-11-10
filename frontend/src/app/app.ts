import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <header class="platform-header">
      <a class="brand" routerLink="/"
        ><span class="brand-icon">g<span>↗</span></span
        >gerar<span class="brand-light">commerce</span></a
      >
      <nav aria-label="Menu principal">
        <a routerLink="/">Explorar lojas</a
        ><a class="button small" routerLink="/criar">Criar minha loja <span>↗</span></a>
      </nav>
    </header>
    <router-outlet />
    <footer class="platform-footer">
      <a class="brand" routerLink="/">gerar<span class="brand-light">commerce</span></a
      ><span>Um framework. Infinitas possibilidades.</span
      ><span>Projeto acadêmico · UFAL · Planos e pagamentos fictícios</span>
    </footer>
  `,
})
export class App {}
