import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  inject,
} from '@angular/core';

const dialogs: DialogFocus[] = [];
let originalOverflow = '';

@Directive({ selector: '[dialogFocus]', standalone: true })
export class DialogFocus implements AfterViewInit, OnDestroy {
  private element: HTMLElement = inject(ElementRef).nativeElement;
  private previous = document.activeElement as HTMLElement | null;
  private controls() {
    return [
      ...this.element.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]',
      ),
    ].filter((el) => el.getClientRects().length > 0);
  }
  ngAfterViewInit() {
    if (!dialogs.length) originalOverflow = document.body.style.overflow;
    dialogs.push(this);
    this.updateLayers();
    document.body.style.overflow = 'hidden';
    queueMicrotask(() => {
      if (dialogs.at(-1) === this) this.focusInitial();
    });
  }
  private updateLayers() {
    for (const dialog of dialogs) {
      const active = dialog === dialogs.at(-1);
      dialog.element.inert = !active;
      dialog.element.setAttribute('aria-modal', String(active));
    }
  }
  private focusInitial() {
    const preferred = this.element.querySelector<HTMLElement>('[data-dialog-autofocus]');
    const target = preferred ?? this.controls()[0] ?? this.element;
    if (target === this.element) this.element.tabIndex = -1;
    target.focus();
  }
  @HostListener('document:focusin', ['$event']) onFocus(event: FocusEvent) {
    if (dialogs.at(-1) === this && !this.element.contains(event.target as Node))
      this.focusInitial();
  }
  @HostListener('keydown', ['$event']) onKey(event: KeyboardEvent) {
    if (event.key !== 'Tab' || dialogs.at(-1) !== this) return;
    const items = this.controls(),
      first = items[0],
      last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  ngOnDestroy() {
    const wasActive = dialogs.at(-1) === this;
    const index = dialogs.indexOf(this);
    if (index !== -1) dialogs.splice(index, 1);
    this.updateLayers();
    const active = dialogs.at(-1);
    if (active) {
      // O painel que termina uma animação de saída não pode roubar o foco do login.
      if (wasActive) {
        if (this.previous?.isConnected && active.element.contains(this.previous))
          this.previous.focus();
        else active.focusInitial();
      }
    } else {
      document.body.style.overflow = originalOverflow;
      if (this.previous?.isConnected) this.previous.focus();
    }
  }
}
