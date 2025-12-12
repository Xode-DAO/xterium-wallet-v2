import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
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
  ToastController
} from '@ionic/angular/standalone';

import { Network } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model'

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { DeepLinkService } from 'src/app/api/deep-link/deep-link.service';

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
    private utilsService: UtilsService,
    private chainsService: ChainsService,
    private walletsService: WalletsService,
    public environmentService: EnvironmentService,
    private deepLinkService: DeepLinkService,
    private toastController: ToastController,
  ) { }

  chains: Chain[] = [];
  wallets: Wallet[] = [];

  chainsByName: Record<string, Chain[]> = {};
  walletsByChain: Record<string, Wallet[]> = {};

  selectedAccounts: Wallet[] = [];

  origin: string = "";

  callBackUrl: string = "";
  chainId: number = 0;
  selectedChainName: string = "";

  getChains(): void {
    const allChains = this.chainsService.getChainsByNetwork(Network.All);
    const liveChains = this.chainsService.getChainsByNetwork(Network.Polkadot);

    this.chains = [...allChains, ...liveChains];
    this.loadChainByName();
  }

  loadChainByName(): void {
    this.chainsByName["All Chains"] = this.chains;
  }

  async getWallet(): Promise<void> {
    this.wallets = await this.walletsService.getAllWallets();
  
    if (this.chainId) {
      await this.loadWalletsByChainId(this.chainId);
    }
  }

  getChainByChainId(chainId: number) {
    const selectedChain = this.chainsService.getChainByChainId(chainId);
      
    if (!selectedChain) {
      return;
    }

    this.chainId = selectedChain.chain_id;
    this.loadWalletsByChainId(this.chainId);
      
  }
  
  getChainImage(name: string) {
    const chain = this.chains.find(c => c.name === name);
    return chain?.image ?? 'default.png';
  }
  
  async loadWalletsByChainId(chainId: number): Promise<void> {
    this.walletsByChain = {};
  
    const selectedChain = this.chains.find(c => c.chain_id === chainId);
    if (!selectedChain) return;
  
    this.selectedChainName = selectedChain.name;
  
    const filtered = this.wallets.filter(w => w.chain.id === selectedChain.id);
  
    const mapped = await Promise.all(
      filtered.map(async wallet => ({
        ...wallet,
        public_key: await this.encodePublicAddressByChainFormat(wallet.public_key, selectedChain)
      }))
    );
  
    this.walletsByChain[selectedChain.name] = mapped;
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
      const currentlySelected = this.selectedAccounts.some(
        acc => acc.public_key === wallet.public_key && acc.chain === wallet.chain
      );

      isChecked = !currentlySelected;
    }

    if (isChecked) {
      if (!this.selectedAccounts.some(acc => acc.public_key === wallet.public_key && acc.chain === wallet.chain)) {
        this.selectedAccounts.push(wallet);
      }
    } else {
      this.selectedAccounts = this.selectedAccounts.filter(
        acc => acc.public_key !== wallet.public_key && acc.chain === wallet.chain
      );
    }
  }

  isWalletSelected(wallet: Wallet): boolean {
    return this.selectedAccounts.some(acc => acc.public_key === wallet.public_key && acc.chain === wallet.chain);
  }

  async connect() {
    const encodedWallets = (
      await Promise.all(
        this.selectedAccounts.map(async (wallet) => {
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
      chrome.runtime.sendMessage({
        type: "xterium-approval-response",
        payload: {
          origin: this.origin,
          selected_accounts: encodedWallets,
          approved: true,
        },
      });
    }
  
    const callbackEncoded = this.callBackUrl
      ? encodeURIComponent(this.callBackUrl) 
      : "";
      
      const deeplink =
        `xterium://app/web3/approval?` +
        `selected_accounts=${encodeURIComponent(JSON.stringify(encodedWallets))}` +
        `&approved=true` +
        (this.callBackUrl ? `&callback=${callbackEncoded}` : "");

      this.deepLinkService.sendDeeplink(deeplink, this.callBackUrl, encodedWallets);
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

    App.exitApp();
  }

  async showToast(message: string, color: string = "primary") {
    const toast = await this.toastController.create({
      message,
      duration: 20000,
      position: "bottom",
      color,
    });
    await toast.present();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['origin']) {
        this.origin = params['origin'];
      }
      
      if (params['callback']) {
        this.callBackUrl = decodeURIComponent(params['callback']);
      }

      if (params['chainId']) {
        this.chainId = Number(params['chainId']);
        this.getChainByChainId(this.chainId);
      }
    });

    this.getChains();
    this.getWallet();
  }
}
