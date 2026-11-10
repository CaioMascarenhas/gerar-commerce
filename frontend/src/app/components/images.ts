import { Component, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageFrame } from '../models/commerce';

@Component({
  selector: 'commerce-image',
  standalone: true,
  host: { class: 'commerce-image' },
  template: `
    @if (src() && !failed()) {
      <img
        [src]="src()"
        [alt]="alt()"
        [loading]="eager() ? 'eager' : 'lazy'"
        referrerpolicy="no-referrer"
        [style.object-fit]="frame()?.fit || 'contain'"
        [style.object-position]="(frame()?.x ?? 50) + '% ' + (frame()?.y ?? 50) + '%'"
        [style.transform-origin]="(frame()?.x ?? 50) + '% ' + (frame()?.y ?? 50) + '%'"
        [style.transform]="'scale(' + (frame()?.zoom ?? 1) + ')'"
        (error)="failed.set(true)"
      />
    } @else {
      <span class="image-fallback" role="img" [attr.aria-label]="alt() + ': imagem indisponível'"
        >▧<small>{{ src() ? 'Imagem indisponível' : 'Sem foto' }}</small></span
      >
    }
  `,
})
export class CommerceImage {
  src = input('');
  alt = input('Imagem');
  frame = input<ImageFrame>();
  eager = input(false);
  failed = signal(false);
  constructor() {
    effect(() => {
      this.src();
      this.failed.set(false);
    });
  }
}

@Component({
  selector: 'image-editor',
  standalone: true,
  imports: [FormsModule, CommerceImage],
  template: `
    <div class="image-editor">
      <div class="image-editor-preview" [class.cover-preview]="cover()">
        <commerce-image [src]="value()" [frame]="currentFrame()" [alt]="label()" [eager]="true" />
      </div>
      <div class="hero-actions">
        <label class="button secondary small upload-button"
          >Escolher foto
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            (change)="upload($event)"
            [disabled]="uploading()"
          />
        </label>
        @if (value()) {
          <button class="text-link" type="button" (click)="reset()">Restaurar enquadramento</button>
        }
      </div>
      <label
        >Ou cole o link direto da imagem (HTTPS)
        <input
          type="url"
          [ngModel]="value().startsWith('data:') ? '' : value()"
          [ngModelOptions]="{ standalone: true }"
          (ngModelChange)="setUrl($event)"
          placeholder="https://…/foto.jpg"
        />
      </label>
      @if (value()) {
        <div class="image-controls">
          <label
            >Encaixe<select
              [ngModel]="currentFrame().fit"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="adjust('fit', $event)"
            >
              <option value="contain">Mostrar foto inteira</option>
              <option value="cover">Preencher espaço</option>
            </select></label
          >
          <label
            >Zoom {{ currentFrame().zoom.toFixed(1) }}×<input
              aria-label="Zoom da foto"
              type="range"
              min="1"
              max="3"
              step="0.1"
              [ngModel]="currentFrame().zoom"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="adjust('zoom', +$event)"
          /></label>
          <label
            >Posição horizontal<input
              aria-label="Posição horizontal da foto"
              type="range"
              min="0"
              max="100"
              [ngModel]="currentFrame().x"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="adjust('x', +$event)"
          /></label>
          <label
            >Posição vertical<input
              aria-label="Posição vertical da foto"
              type="range"
              min="0"
              max="100"
              [ngModel]="currentFrame().y"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="adjust('y', +$event)"
          /></label>
        </div>
        @if (value().startsWith('https://')) {
          <p class="muted">
            O link precisa ser público e apontar para uma imagem. Links de páginas, com login ou
            proteção contra uso externo podem falhar. Confira a prévia acima.
          </p>
        }
      }
      @if (error()) {
        <p class="notice error" role="alert">{{ error() }}</p>
      }
      @if (uploading()) {
        <p role="status">Preparando foto…</p>
      }
      <small class="muted"
        >JPG, PNG ou WebP até 2 MB. A foto enviada é otimizada para a loja.</small
      >
    </div>
  `,
})
export class ImageEditor {
  value = input('');
  valueChange = output<string>();
  frame = input<ImageFrame>();
  frameChange = output<ImageFrame>();
  cover = input(false);
  label = input('Prévia da foto');
  error = signal('');
  uploading = signal(false);
  currentFrame(): ImageFrame {
    return this.frame() ?? { fit: this.cover() ? 'cover' : 'contain', x: 50, y: 50, zoom: 1 };
  }
  adjust(key: keyof ImageFrame, value: string | number) {
    this.frameChange.emit({ ...this.currentFrame(), [key]: value } as ImageFrame);
  }
  reset() {
    this.frameChange.emit({ fit: this.cover() ? 'cover' : 'contain', x: 50, y: 50, zoom: 1 });
  }
  setUrl(value: string) {
    this.error.set('');
    this.valueChange.emit(value.trim());
    this.reset();
  }
  async upload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set('');
    this.uploading.set(true);
    try {
      if (
        !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
        file.size > 2 * 1024 * 1024
      )
        throw new Error('Escolha uma foto JPG, PNG ou WebP de até 2 MB.');
      const bitmap = await createImageBitmap(file);
      const ratio = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Não foi possível preparar a foto.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      this.valueChange.emit(canvas.toDataURL('image/webp', 0.85));
      this.reset();
    } catch (error) {
      this.error.set((error as Error).message || 'Não foi possível ler a foto.');
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }
}
