import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  get<T = any>(path: string) {
    return firstValueFrom(this.http.get<T>('/api' + path));
  }
  post<T = any>(path: string, body: unknown) {
    return firstValueFrom(this.http.post<T>('/api' + path, body));
  }
  put<T = any>(path: string, body: unknown) {
    return firstValueFrom(this.http.put<T>('/api' + path, body));
  }
  delete<T = any>(path: string) {
    return firstValueFrom(this.http.delete<T>('/api' + path));
  }
}
export function errorMessage(error: any): string {
  const message = error?.error?.message ?? error?.error;
  return typeof message === 'string'
    ? message
    : error?.status === 0
      ? 'Não foi possível conectar ao servidor. Confira se o backend está em execução.'
      : 'Não foi possível concluir a ação. Tente novamente.';
}
