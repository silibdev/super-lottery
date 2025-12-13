import { Routes } from '@angular/router';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  {
    path: 'lotteries/manage',
    loadComponent: () =>
      import('./manage-lotteries/manage-lotteries').then((m) => m.ManageLotteries),
  },
  {
    path: 'lotteries/manage/:id',
    loadComponent: () =>
      import('./lottery-settings/lottery-settings').then((m) => m.LotterySettings),
  },
  {
    path: 'lotteries/joined',
    loadComponent: () =>
      import('./joined-lotteries/joined-lotteries').then((m) => m.JoinedLotteries),
  },
  {
    path: 'lotteries/joined/:id',
    loadComponent: () => import('./joined-lottery/joined-lottery').then((m) => m.JoinedLottery),
  },
];
