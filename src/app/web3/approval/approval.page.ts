import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { App } from '@capacitor/app';

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
  IonToast,
  ToastController
} from '@ionic/angular/standalone';

import { Network } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model'

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { SettingsService } from 'src/app/api/settings/settings.service';

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
    IonToast
  ]
})
export class ApprovalPage implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private utilsService: UtilsService,
    private chainsService: ChainsService,
    private walletsService: WalletsService,
    private environmentService: EnvironmentService,
    private settingsService: SettingsService,
    private toastController: ToastController
  ) { }

  chains: Chain[] = [];
  selectedChain: Chain = new Chain();

  wallets: Wallet[] = [];
  walletsByChain: Record<number, Wallet[]> = {};
  selectedWallets: Wallet[] = [];

  paramsOrigin: string | null = null;
  paramsChainId: number | null = null;
  paramsCallbackUrl: string | null = null;

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

    if (this.paramsChainId && this.paramsChainId !== null) {
      const chainById = chains.find(c => c.chain_id === this.paramsChainId);
      if (chainById) {
        this.chains = [chainById];
      }
    } else {
      this.chains = chains;
    }

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

  truncateAddress(address: string): string {
    return this.utilsService.truncateAddress(address);
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

  isWalletSelected(wallet: Wallet): boolean {
    return this.selectedWallets.some(acc => acc.public_key === wallet.public_key && acc.chain === wallet.chain);
  }

  async initConnection(): Promise<void> {
    this.route.queryParams.subscribe(params => {
      if (params['origin']) {
        this.paramsOrigin = params['origin'];
      }

      if (params['chainId']) {
        this.paramsChainId = Number(params['chainId']);
      }

      if (params['callbackUrl']) {
        this.paramsCallbackUrl = decodeURIComponent(params['callbackUrl']);
      }
    });

    await this.getChains();
  }

  async connect() {
    const encodedWallets = (
      await Promise.all(
        this.selectedWallets.map(async (wallet) => {
          const rawWallet = this.wallets.find(d => d.id === wallet.id);
          if (!rawWallet) return null;

          const publicKeyU8a = new Uint8Array(
            rawWallet.public_key.split(",").map((byte) => Number(byte.trim()))
          );

          const ss58Format = Number(rawWallet.chain?.address_prefix ?? 42);

          return {
            address: await this.utilsService.encodePublicAddressByChainFormat(publicKeyU8a, ss58Format),
            name: wallet.name,
          }
        })
      )
    )

    if (this.environmentService.isChromeExtension()) {
      chrome.runtime.sendMessage(
        {
          method: "connection-approval",
          payload: {
            origin: this.paramsOrigin,
            selected_accounts: encodedWallets,
            approved: true,
          },
        },
        (response) => {
          console.log('Approval response sent', response);
        }
      );
    } else {
      if (this.paramsCallbackUrl && this.paramsCallbackUrl !== null) {
        this.router.navigate(['/xterium/balances']);

        const finalUrl = `${this.paramsCallbackUrl}?selectedAccounts=${encodeURIComponent(JSON.stringify(encodedWallets))}`;
        window.open(finalUrl, '_blank');
      } else {
        const toast = await this.toastController.create({
          message: 'No callback URL provided.',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });
        await toast.present();
      }
    }
  }

  reject() {
    if (this.environmentService.isChromeExtension()) {
      chrome.runtime.sendMessage(
        {
          method: "connection-approval",
          payload: {
            origin: this.paramsOrigin,
            selected_accounts: [],
            approved: false,
          },
        },
        (response) => {
          console.log('Approval response sent', response);
        }
      );
    } else {
      this.router.navigate(['/xterium/balances']);
      App.exitApp();
    }
  }

  ngOnInit() {
    this.initConnection();
  }
}
