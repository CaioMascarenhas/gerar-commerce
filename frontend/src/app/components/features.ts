import { Component, Input } from '@angular/core';
import { Feature } from '../models/commerce';
@Component({
  selector: 'feature-picker',
  standalone: true,
  template: `
    <div class="feature-heading">
      <h3>O essencial já vem com você.</h3>
      <span class="pill green">{{ core().length }} funcionalidades incluídas</span>
    </div>
    <p class="muted">A base obrigatória da sua loja, sempre selecionada.</p>
    <div class="core-grid">
      @for (feature of core(); track feature.id) {
        <label class="core-item"
          ><input type="checkbox" checked disabled /><span>{{ feature.name }}</span
          ><small>Incluído</small></label
        >
      }
    </div>
    <div class="feature-heading optional-heading">
      <h3>Dê o seu próximo passo.</h3>
      <span class="muted">Opcionais</span>
    </div>
    <p class="muted">Combine funcionalidades para criar a loja que faz sentido para você.</p>
    <div class="optional-grid">
      @for (feature of optional(); track feature.id) {
        <label class="feature-option" [class.selected]="options.includes(feature.id)"
          ><input
            type="checkbox"
            [checked]="options.includes(feature.id)"
            (change)="toggle(feature.id)"
          /><span
            ><strong>{{ feature.name }}</strong
            ><small>{{ feature.description }}</small></span
          >
          @if (feature.id === 'aiAssistant') {
            <b class="ai-badge">IA</b>
          }
        </label>
      }
    </div>
  `,
})
export class FeaturePicker {
  @Input() features: Feature[] = [];
  @Input() options: string[] = [];
  core() {
    return this.features.filter((f) => f.core);
  }
  optional() {
    return this.features.filter((f) => !f.core);
  }
  toggle(id: string) {
    const index = this.options.indexOf(id);
    if (index >= 0) this.options.splice(index, 1);
    else this.options.push(id);
  }
}
