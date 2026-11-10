import { Routes } from '@angular/router';
import { HomePage } from './pages/home';
import { BuilderPage } from './pages/builder';
import { StorePage } from './pages/store';
import { AdminPage } from './pages/admin';
export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'criar', component: BuilderPage },
  { path: 'loja/:slug', component: StorePage },
  { path: 'admin/:slug', component: AdminPage },
  { path: '**', redirectTo: '' },
];
