import { Component, OnInit, ViewChild, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonModal,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline } from 'ionicons/icons';

import { ChainsComponent } from "src/app/xterium/shared/chains/chains.component";
import { WalletDetailsComponent } from 'src/app/xterium/shared/wallets/wallet-details/wallet-details.component';

import { Chain, Network } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model'

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

@Component({
  selector: 'app-wallets',
  templateUrl: './wallets.component.html',
  styleUrls: ['./wallets.component.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonModal,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    ChainsComponent,
    WalletDetailsComponent
  ]
})
export class WalletsComponent implements OnInit {
  @ViewChild('selectChainModal', { read: IonModal }) selectChainModal!: IonModal;
  @ViewChild('walletDetailsModal', { read: IonModal }) walletDetailsModal!: IonModal;

  @Input() newlyAddedWallet: Wallet = {} as Wallet;

  @Output() onFilteredChain = new EventEmitter<Chain>();
  @Output() onSetCurrentWallet = new EventEmitter<Wallet>();

  constructor(
    private polkadotJsService: PolkadotJsService,
    private chainsService: ChainsService,
    private walletsService: WalletsService,
  ) {
    addIcons({
      ellipsisVerticalOutline,
    });
  }

  chains: Chain[] = [];
  wallets: Wallet[] = [];

  chainsByName: Record<string, Chain[]> = {};
  walletsByChain: Record<string, Wallet[]> = {};

  selectedChain: Chain = {} as Chain;
  selectedWallet: Wallet = {} as Wallet;

  currentWallet: Wallet = {} as Wallet;
  currentWalletPublicAddress: string = '';

  getChains(): void {
    const allChains = this.chainsService.getChainsByNetwork(Network.All);
    const liveChains = this.chainsService.getChainsByNetwork(Network.Polkadot);

    this.chains = [...allChains, ...liveChains];
    this.selectedChain = this.chains[0];

    this.loadChainByName();
  }

  loadChainByName(): void {
    this.chainsByName = {};

    if (this.selectedChain.name === "All Chains") {
      this.chainsByName["All Chains"] = this.chains;
    } else {
      const mapped = this.chains.filter(chain => chain.name.toLowerCase() === this.selectedChain.name.toLowerCase());
      this.chainsByName[this.selectedChain.name] = mapped;
    }
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

  async getCurrentWallet(): Promise<void> {
    const currentWallet = await this.walletsService.getCurrentWallet();
    if (currentWallet) {
      this.currentWallet = currentWallet;
      this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, this.currentWallet.chain)
    }
  }

  truncateAddress(address: string): string {
    return this.polkadotJsService.truncateAddress(address);
  }

  openSelectChainModal() {
    this.selectChainModal.present();
  }

  onSelectedChain(chain: Chain) {
    this.selectedChain = chain;

    this.loadChainByName();
    this.loadWalletsByChain();

    this.selectChainModal.dismiss();

    this.onFilteredChain.emit(chain);
  }

  async setCurrentWallet(wallet: Wallet) {
    const walletById = await this.walletsService.getWalletById(wallet.id);
    if (walletById) {
      this.selectedWallet = walletById;

      await this.walletsService.setCurrentWallet(walletById.id);
      this.onSetCurrentWallet.emit(walletById);
    }
  }

  async openWalletDetailsModal(wallet: Wallet) {
    const walletById = await this.walletsService.getWalletById(wallet.id);
    if (walletById) {
      this.selectedWallet = walletById;
      this.walletDetailsModal.present();
    }
  }

  async onUpdatedWallet() {
    await this.getWallets();
    await this.getCurrentWallet();
  }

  async onDeletedWallet() {
    await this.getWallets();
    await this.getCurrentWallet();

    this.walletDetailsModal.dismiss();
  }

  ngOnInit() {
    this.getChains();
    this.getWallets();
    this.getCurrentWallet();
  }

  ngOnChanges(changes: SimpleChanges) {
    const wallet = changes['newlyAddedWallet']?.currentValue;
    if (wallet && Object.keys(wallet).length > 0) {
      this.getWallets();
      this.getCurrentWallet();
    }
  }
}
