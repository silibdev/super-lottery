import { Routes } from '@angular/router';
import { Home } from './home/home';

export const routes: Routes = [
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  {path: 'home', component: Home},
  {path: 'lotteries/manage', loadComponent: () => import('./manage-lotteries/manage-lotteries').then(m => m.ManageLotteries)}
];
