import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import pt from '@angular/common/locales/pt';
import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

registerLocaleData(pt);
bootstrapApplication(App, {
  providers: [provideHttpClient(), { provide: LOCALE_ID, useValue: 'pt-BR' }],
}).catch(console.error);
