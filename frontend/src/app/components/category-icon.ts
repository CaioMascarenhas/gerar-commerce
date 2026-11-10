import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'category-icon',
  standalone: true,
  host: {
    class: 'category-icon',
    'aria-hidden': 'true',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
  template: `<svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
    <use [attr.href]="source()" />
  </svg>`,
})
export class CategoryIcon {
  category = input.required<string>();
  size = input(36);
  source = computed(
    () =>
      '/icons/categories.svg#' +
      (['eletronicos', 'construcao', 'roupas'].includes(this.category())
        ? this.category()
        : 'eletronicos'),
  );
}
