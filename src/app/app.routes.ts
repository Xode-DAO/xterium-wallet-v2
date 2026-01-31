import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./onboarding/onboarding.page').then(m => m.OnboardingPage),
    children: [
      {
        path: 'select-chain',
        loadComponent: () => import('./onboarding/select-chain/select-chain.page').then(m => m.SelectChainPage)
      },
      {
        path: 'setup-wallet',
        loadComponent: () => import('./onboarding/setup-wallet/setup-wallet.page').then(m => m.SetupWalletPage)
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
        redirectTo: '/onboarding/select-chain',
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
        loadComponent: () => import('./xterium/pay/pay.page').then(m => m.PayPage),
      },
      {
        path: 'cash',
        loadComponent: () => import('./xterium/cash/cash.page').then(m => m.CashPage)
      },
      {
        path: 'payment-details',
        loadComponent: () => import('./xterium/pay/payment-details/payment-details.page').then(m => m.PaymentDetailsPage)
      },
      {
        path: 'payment-summary',
        loadComponent: () => import('./xterium/pay/payment-summary/payment-summary.page').then(m => m.PaymentSummaryPage)
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
    path: 'web3',
    loadComponent: () => import('./web3/web3.page').then(m => m.Web3Page),
    children: [
      {
        path: 'connect-accounts',
        loadComponent: () => import('./web3/connect-accounts/connect-accounts.page').then(m => m.ConnectAccountsPage)
      },
      {
        path: 'sign-transaction',
        loadComponent: () => import('./web3/sign-transaction/sign-transaction.page').then(m => m.SignTransactionPage)
      },
      {
        path: '',
        redirectTo: '/web3/connect-accounts',
        pathMatch: 'full',
      },
    ]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'select-chain',
    loadComponent: () => import('./onboarding/select-chain/select-chain.page').then(m => m.SelectChainPage)
  },
  {
    path: 'connect-accounts',
    loadComponent: () => import('./web3/connect-accounts/connect-accounts.page').then(m => m.ConnectAccountsPage)
  },
];
