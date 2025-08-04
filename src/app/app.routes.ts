import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'onboarding/welcome',
    loadComponent: () => import('./onboarding/welcome/welcome.page').then(m => m.WelcomePage)
  },
  {
    path: 'onboarding/create-new-wallet',
    loadComponent: () => import('./onboarding/create-new-wallet/create-new-wallet.page').then(m => m.CreateNewWalletPage)
  },
  {
    path: 'onboarding/import-options',
    loadComponent: () => import('./onboarding/import-options/import-options.page').then(m => m.ImportOptionsPage)
  },
  {
    path: 'security/login-pin',
    loadComponent: () => import('./security/login-pin/login-pin.page').then(m => m.LoginPinPage)
  },
  {
    path: 'security/login-password',
    loadComponent: () => import('./security/login-password/login-password.page').then(m => m.LoginPasswordPage)
  },
  {
    path: 'xterium/balances',
    loadComponent: () => import('./xterium/balances/balances.page').then(m => m.BalancesPage)
  },
  {
    path: 'xterium/pay',
    loadComponent: () => import('./xterium/pay/pay.page').then(m => m.PayPage)
  },
  {
    path: 'xterium/transaction-history',
    loadComponent: () => import('./xterium/transaction-history/transaction-history.page').then(m => m.TransactionHistoryPage)
  },
  {
    path: 'xterium/explore',
    loadComponent: () => import('./xterium/explore/explore.page').then(m => m.ExplorePage)
  },
];
