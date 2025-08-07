import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    children: [
      {
        path: '',
        redirectTo: '/onboarding/welcome',
        pathMatch: 'full',
      },
    ]
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./onboarding/onboarding.page').then(m => m.OnboardingPage),
    children: [
      {
        path: 'welcome',
        loadComponent: () => import('./onboarding/welcome/welcome.page').then(m => m.WelcomePage)
      },
      {
        path: 'create-new-wallet',
        loadComponent: () => import('./onboarding/create-new-wallet/create-new-wallet.page').then(m => m.CreateNewWalletPage)
      },
      {
        path: 'import-options',
        loadComponent: () => import('./onboarding/import-options/import-options.page').then(m => m.ImportOptionsPage)
      },
      {
        path: '',
        redirectTo: '/onboarding/welcome',
        pathMatch: 'full',
      },
    ]
  },
  {
    path: 'security',
    loadComponent: () => import('./security/security.page').then(m => m.SecurityPage),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./security/login/login.page').then(m => m.LoginPage)
      },
      {
        path: '',
        redirectTo: '/security/login',
        pathMatch: 'full',
      },
    ]
  },
  {
    path: 'xterium',
    loadComponent: () => import('./xterium/xterium.page').then(m => m.XteriumPage),
    children: [
      {
        path: 'balances',
        loadComponent: () => import('./xterium/balances/balances.page').then(m => m.BalancesPage)
      },
      {
        path: 'token-details',
        loadComponent: () => import('./xterium/balances/token-details/token-details.page').then(m => m.TokenDetailsPage)
      },
      {
        path: 'swap',
        loadComponent: () => import('./xterium/swap/swap.page').then(m => m.SwapPage)
      },
      {
        path: 'pay',
        loadComponent: () => import('./xterium/pay/pay.page').then(m => m.PayPage)
      },
      {
        path: 'transaction-history',
        loadComponent: () => import('./xterium/transaction-history/transaction-history.page').then(m => m.TransactionHistoryPage)
      },
      {
        path: 'explore',
        loadComponent: () => import('./xterium/explore/explore.page').then(m => m.ExplorePage)
      },
      {
        path: '',
        redirectTo: '/xterium/balances',
        pathMatch: 'full',
      },
    ]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
