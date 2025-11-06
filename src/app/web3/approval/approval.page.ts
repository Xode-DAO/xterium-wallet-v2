import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
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

import { Chain, Network } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model'

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { EnvironmentService } from 'src/app/api/environment/environment.service';

@Component({
  selector: 'app-approval',
  templateUrl: './approval.page.html',
  styleUrls: ['./approval.page.scss'],
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
export class ApprovalPage implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private polkadotJsService: PolkadotJsService,
    private chainsService: ChainsService,
    private walletsService: WalletsService,
    public environmentService: EnvironmentService,
  ) { }

  chains: Chain[] = [];
  wallets: Wallet[] = [];

  chainsByName: Record<string, Chain[]> = {};
  walletsByChain: Record<string, Wallet[]> = {};

  selectedAccounts: Wallet[] = [];

  origin: string = "";

  getChains(): void {
    const allChains = this.chainsService.getChainsByNetwork(Network.All);
    const liveChains = this.chainsService.getChainsByNetwork(Network.Polkadot);

    this.chains = [...allChains, ...liveChains];
    this.loadChainByName();
  }

  loadChainByName(): void {
    this.chainsByName["All Chains"] = this.chains;
  }

  async getWallets(): Promise<void> {
    this.wallets = await this.walletsService.getAllWallets();
    this.loadWalletsByChain();
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

      this.walletsByChain[chain.name] = mapped;
    }
  }

  async encodePublicAddressByChainFormat(publicKey: string, chain: Chain): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = typeof chain.address_prefix === 'number' ? chain.address_prefix : 0;
    return await this.polkadotJsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  truncateAddress(address: string): string {
    return this.polkadotJsService.truncateAddress(address);
  }

  toggleCheckbox(wallet: Wallet, event: any) {
    let isChecked: boolean;

    if (event && event.detail && typeof event.detail.checked !== 'undefined') {
      isChecked = event.detail.checked;
    } else {
      const currentlySelected = this.selectedAccounts.some(
        acc => acc.public_key === wallet.public_key
      );

      isChecked = !currentlySelected;
    }

    if (isChecked) {
      if (!this.selectedAccounts.some(acc => acc.public_key === wallet.public_key)) {
        this.selectedAccounts.push(wallet);
      }
    } else {
      this.selectedAccounts = this.selectedAccounts.filter(
        acc => acc.public_key !== wallet.public_key
      );
    }
  }

  isWalletSelected(wallet: Wallet): boolean {
    return this.selectedAccounts.some(acc => acc.public_key === wallet.public_key);
  }

  async connect() {
    if (this.environmentService.isChromeExtension()) {
      if (this.selectedAccounts.length > 0) {
        const encodedWallets = await Promise.all(
          this.selectedAccounts.map(async (wallet) => {
            const rawWallet = this.wallets.find(d => d.id === wallet.id);
            if (!rawWallet) return null;

            const publicKeyU8a = new Uint8Array(
              rawWallet.public_key.split(",").map((byte) => Number(byte.trim()))
            );

            return {
              address: await this.polkadotJsService.encodePublicAddressByChainFormat(publicKeyU8a, 42),
              name: wallet.name,
            };
          })
        );

        console.log("Selected accounts to connect:", encodedWallets);

        chrome.runtime.sendMessage({
          type: "xterium-approval-response",
          payload: {
            origin: this.origin,
            selected_accounts: encodedWallets,
            approved: true,
          },
        });
      }
    }
  }

  reject() {
    if (this.environmentService.isChromeExtension()) {
      chrome.runtime.sendMessage({
        type: "xterium-approval-response",
        payload: {
          origin: this.origin,
          selected_accounts: [],
          approved: false,
        },
      });
    }
  }

  ngOnInit() {
    this.getChains();
    this.getWallets();

    this.route.queryParams.subscribe(params => {
      if (params['origin']) {
        this.origin = params['origin'];
      }
    });
  }
}
