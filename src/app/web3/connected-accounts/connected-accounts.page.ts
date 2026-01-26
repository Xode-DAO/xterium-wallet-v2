import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonFooter,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonCheckbox,
} from '@ionic/angular/standalone';

import { Wallet } from 'src/models/wallet.model';
import { Chain } from 'src/models/chain.model';
import { Network } from 'src/models/network.model';

import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { SettingsService } from 'src/app/api/settings/settings.service';
import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';

interface Account {
  address: string;
  name: string;
}

@Component({
  selector: 'app-connected-accounts',
  templateUrl: './connected-accounts.page.html',
  styleUrls: ['./connected-accounts.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonFooter,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonCheckbox,
]
})
export class ConnectedAccountsPage implements OnInit {

  accounts: Account[] = [];

  constructor(
    private router: Router,
    private utilsService: UtilsService,
    private chainsService: ChainsService,
    private walletsService: WalletsService,
    private settingsService: SettingsService
  ) { }

  chains: Chain[] = [];

  wallets: Wallet[] = [];
  walletsByChain: Record<number, Wallet[]> = {};

  selectedWallets: Wallet[] = [];

  async getChains(): Promise<void> {
      const [polkadotChains, paseoChains, rococoChains] = [
        this.chainsService.getChainsByNetwork(Network.Polkadot),
        this.chainsService.getChainsByNetwork(Network.Paseo),
        this.chainsService.getChainsByNetwork(Network.Rococo),
      ];
  
      let chains: Chain[] = [...polkadotChains];
  
      const settings = await this.settingsService.get();
      const isTestnetEnabled = settings?.user_preferences?.testnet_enabled;
  
      if (isTestnetEnabled) {
        chains = [
          ...polkadotChains,
          ...paseoChains,
          ...rococoChains
        ];
      }
  
      this.chains = chains;
  
      await this.getWallets();
    }

  async getWallets(): Promise<void> {
    this.wallets = await this.walletsService.getAllWallets();
    await this.loadWalletsByChain();
  }

  async loadWalletsByChain(): Promise<void> {
    this.walletsByChain = {};

    for (const chain of this.chains) {
      const filtered = this.wallets.filter(
        w => w.chain.id === chain.id
      );

      const mapped = await Promise.all(
        filtered.map(async wallet => ({
          ...wallet,
          public_key: await this.encodePublicAddressByChainFormat(wallet.public_key, chain)
        }))
      );

      this.walletsByChain[chain.id] = mapped;
    }
  }

  async encodePublicAddressByChainFormat(publicKey: string, chain: Chain): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = typeof chain.address_prefix === 'number' ? chain.address_prefix : 0;
    return await this.utilsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  isWalletSelected(wallet: Wallet): boolean {
    return this.selectedWallets.some(acc => acc.public_key === wallet.public_key && acc.chain === wallet.chain);
  }

  toggleCheckbox(wallet: Wallet, event: any) {
    let isChecked: boolean;

    if (event && event.detail && typeof event.detail.checked !== 'undefined') {
      isChecked = event.detail.checked;
    } else {
      const currentlySelected = this.selectedWallets.some(
        acc => acc.public_key === wallet.public_key && acc.chain === wallet.chain
      );

      isChecked = !currentlySelected;
    }

    if (isChecked) {
      if (!this.selectedWallets.some(acc => acc.id === wallet.id)) {
        this.selectedWallets.push(wallet);
      }
    } else {
      this.selectedWallets = this.selectedWallets.filter(
        acc => acc.id !== wallet.id
      );
    }
  }
  
  truncateAddress(address: string): string {
    return this.utilsService.truncateAddress(address);
  }

  async loadAccounts(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn('Not running inside Chrome Extension');
      return;
    }
  
    chrome.storage.local.get(['accounts'], async (result: { accounts?: Account[] }) => {
      this.accounts = result.accounts || [];
  
      const allWallets: Wallet[] = Object.values(this.walletsByChain).flat();
  
      this.selectedWallets = allWallets.filter(wallet =>
        this.accounts.some(acc => acc.address === wallet.public_key)
      );
    });
  }

  async connect(): Promise<void> { 
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn('Not running inside Chrome Extension');
      return;
    }

    const updatedAccounts: Account[] = [];
    
    for (const wallet of this.selectedWallets) {
      const rawWallet = this.wallets.find(w => w.id === wallet.id);
      if (!rawWallet) continue;

      const publicKeyU8a = new Uint8Array(
        rawWallet.public_key.split(',').map(byte => Number(byte.trim()))
      );

      const ss58Format = Number(rawWallet.chain?.address_prefix ?? 42);
      const encodedAddress = await this.utilsService.encodePublicAddressByChainFormat(
        publicKeyU8a,
        ss58Format
      );

      updatedAccounts.push({ address: encodedAddress, name: wallet.name });
    }

    chrome.storage.local.set({ accounts: updatedAccounts }, () => {
      this.accounts = updatedAccounts;
      this.router.navigate(['/xterium/balances']);
    });
  }

  reject(): void {
    this.router.navigate(['/xterium/balances']);
  }

  async fetchData(): Promise<void> {
    await this.getChains();
    this.loadAccounts();
  }

  ngOnInit() {
    this.fetchData();
  }
}
