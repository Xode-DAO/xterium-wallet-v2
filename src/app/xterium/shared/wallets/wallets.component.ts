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

import { NetworksComponent } from "./../../shared/networks/networks.component";
import { WalletDetailsComponent } from "./wallet-details/wallet-details.component";

import { Network } from './../../../../models/network.model';
import { Wallet } from './../../../../models/wallet.model'

import { PolkadotjsService } from '../../../api/polkadotjs/polkadotjs.service';
import { NetworksService } from './../../../api/networks/networks.service';
import { WalletsService } from './../../../api/wallets/wallets.service';

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
    NetworksComponent,
    WalletDetailsComponent
  ]
})
export class WalletsComponent implements OnInit {
  @ViewChild('selectNetworkModal', { read: IonModal }) selectNetworkModal!: IonModal;
  @ViewChild('walletDetailsModal', { read: IonModal }) walletDetailsModal!: IonModal;

  @Input() newlyAddedWallet: Wallet = {} as Wallet;

  @Output() onFilteredNetwork = new EventEmitter<Network>();
  @Output() onSetCurrentWallet = new EventEmitter<Wallet>();

  constructor(
    private polkadotjsService: PolkadotjsService,
    private networksService: NetworksService,
    private walletsService: WalletsService,
  ) {
    addIcons({
      ellipsisVerticalOutline,
    });
  }

  networks: Network[] = [];
  wallets: Wallet[] = [];

  networksByName: Record<string, Network[]> = {};
  walletsByNetwork: Record<string, Wallet[]> = {};

  selectedNetwork: Network = {} as Network;
  selectedWallet: Wallet = {} as Wallet;

  currentWallet: Wallet = {} as Wallet;

  getNetworks(): void {
    const allNetworks = this.networksService.getNetworksByCategory('All');
    const liveNetworks = this.networksService.getNetworksByCategory('Live');

    this.networks = [...allNetworks, ...liveNetworks];
    this.selectedNetwork = this.networks[0];

    this.loadNetworkByName();
  }

  loadNetworkByName(): void {
    this.networksByName = {};

    if (this.selectedNetwork.name === "All Networks") {
      this.networksByName["All Networks"] = this.networks;
    } else {
      const mapped = this.networks.filter(network => network.name.toLowerCase() === this.selectedNetwork.name.toLowerCase());
      this.networksByName[this.selectedNetwork.name] = mapped;
    }
  }

  async getWallets(): Promise<void> {
    this.wallets = await this.walletsService.getAllWallets();
    this.loadWalletsByNetwork();
  }

  async loadWalletsByNetwork(): Promise<void> {
    this.walletsByNetwork = {};

    for (const network of this.networks) {
      const filtered = this.wallets.filter(
        w => w.network_id === network.id
      );

      const mapped = await Promise.all(
        filtered.map(async wallet => ({
          ...wallet,
          public_key: await this.encodePublicAddressByChainFormat(wallet.public_key, network)
        }))
      );

      this.walletsByNetwork[network.name] = mapped;
    }
  }

  async getCurrentWallet(): Promise<void> {
    const currentWallet = await this.walletsService.getCurrentWallet();
    if (currentWallet) {
      this.currentWallet = currentWallet;
    }
  }

  async encodePublicAddressByChainFormat(publicKey: string, network: Network): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = typeof network.address_prefix === 'number' ? network.address_prefix : 0;
    return await this.polkadotjsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  truncateAddress(address: string): string {
    return this.polkadotjsService.truncateAddress(address);
  }

  openSelectNetworkModal() {
    this.selectNetworkModal.present();
  }

  onSelectedNetwork(network: Network) {
    this.selectedNetwork = network;

    this.loadNetworkByName();
    this.loadWalletsByNetwork();

    this.selectNetworkModal.dismiss();

    this.onFilteredNetwork.emit(network);
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
    this.getNetworks();
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
