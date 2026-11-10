import { Injectable, inject, signal } from '@angular/core';
import { Api } from './api';
import { Customer, Store } from './models/commerce';

interface StoreProfiles {
  name: string;
  admin: boolean;
  buyer: Customer | null;
}

@Injectable({ providedIn: 'root' })
export class StoreSessions {
  private api = inject(Api);
  private requests = new Map<string, Promise<StoreProfiles>>();
  private revisions = new Map<string, number>();
  readonly profiles = signal<Record<string, StoreProfiles>>({});
  readonly activeSlug = signal('');

  profile(slug: string): StoreProfiles {
    return this.profiles()[slug] ?? { name: slug, admin: false, buyer: null };
  }
  private revision(slug: string, role: string) {
    return this.revisions.get(slug + ':' + role) ?? 0;
  }
  private changed(slug: string, role: string) {
    this.revisions.set(slug + ':' + role, this.revision(slug, role) + 1);
  }
  private update(slug: string, fields: Partial<StoreProfiles>) {
    this.profiles.update((profiles) => ({
      ...profiles,
      [slug]: { ...this.profile(slug), ...fields },
    }));
  }
  setAdmin(slug: string, admin: boolean) {
    this.changed(slug, 'admin');
    this.update(slug, { admin });
    if (admin) localStorage.setItem('gerar-session-store', slug);
  }
  setBuyer(slug: string, buyer: Customer | null) {
    this.changed(slug, 'buyer');
    this.update(slug, { buyer });
    if (buyer) localStorage.setItem('gerar-session-store', slug);
  }
  setName(slug: string, name: string) {
    this.update(slug, { name });
  }
  refresh(slug: string): Promise<StoreProfiles> {
    const pending = this.requests.get(slug);
    if (pending) return pending;
    const adminRevision = this.revision(slug, 'admin');
    const buyerRevision = this.revision(slug, 'buyer');
    const request = Promise.all([
      this.api.get<Store>('/stores/' + slug),
      this.api
        .get('/stores/' + slug + '/session')
        .then(() => true)
        .catch((error) => {
          if (error.status === 401) return false;
          throw error;
        }),
      this.api.get<Customer>('/stores/' + slug + '/customer-session').catch((error) => {
        if (error.status === 401) return null;
        throw error;
      }),
    ])
      .then(([store, admin, buyer]) => {
        // Uma consulta antiga não pode desfazer login ou logout mais recente.
        this.update(slug, {
          name: store.name,
          ...(adminRevision === this.revision(slug, 'admin') ? { admin } : {}),
          ...(buyerRevision === this.revision(slug, 'buyer') ? { buyer } : {}),
        });
        return this.profile(slug);
      })
      .finally(() => this.requests.delete(slug));
    this.requests.set(slug, request);
    return request;
  }
  async logoutAdmin(slug: string) {
    await this.api.post('/stores/' + slug + '/logout', {});
    this.setAdmin(slug, false);
  }
  async logoutBuyer(slug: string) {
    await this.api.post('/stores/' + slug + '/customer-logout', {});
    this.setBuyer(slug, null);
  }
}
