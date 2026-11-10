import { Routes } from '@angular/router';
import { HomePage } from './pages/home';
import { BuilderPage } from './pages/builder';
import { StorePage } from './pages/store';
import { AdminPage } from './pages/admin';
import { MyStorePage } from './pages/my-store';
import { BuyerLoginPage } from './pages/buyer-login';
export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'criar', component: BuilderPage },
  { path: 'minha-loja', component: MyStorePage },
  { path: 'entrar', component: BuyerLoginPage },
  { path: 'loja/:slug/produto/:productId', component: StorePage },
  { path: 'loja/:slug', component: StorePage },
  { path: 'admin/:slug', component: AdminPage },
  { path: '**', redirectTo: '' },
];
