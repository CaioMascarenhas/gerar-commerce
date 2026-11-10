import { Window } from 'happy-dom';
const browser = new Window({ url: 'http://localhost:4200' });
for (const key of [
  'window',
  'document',
  'Node',
  'Element',
  'HTMLElement',
  'HTMLInputElement',
  'Event',
  'FocusEvent',
  'KeyboardEvent',
  'MouseEvent',
  'Document',
  'ShadowRoot',
  'navigator',
  'localStorage',
  'sessionStorage',
  'MutationObserver',
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: key === 'window' ? browser : browser[key],
  });
}
globalThis.getComputedStyle = browser.getComputedStyle.bind(browser);
globalThis.requestAnimationFrame = browser.requestAnimationFrame.bind(browser);
globalThis.cancelAnimationFrame = browser.cancelAnimationFrame.bind(browser);
// O DOM de testes não calcula geometria; os controles destes fixtures estão visíveis.
browser.HTMLElement.prototype.getClientRects = function () {
  return this.hidden ? [] : [{ width: 100, height: 30 }];
};
await import('@angular/compiler');
