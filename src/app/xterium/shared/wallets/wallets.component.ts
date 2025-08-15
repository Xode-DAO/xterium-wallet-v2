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

  @Output() onFilteredNetwork = new EventEmitter<Network>();
  @Input() newlyAddedWallet: Wallet = {} as Wallet;

  constructor(
    private polkadotjsService: PolkadotjsService,
    private networksService: NetworksService,
    private walletsService: WalletsService,
  ) {
    addIcons({
      ellipsisVerticalOutline,
    });
  }

  mainPresentingElement!: HTMLElement | null;

  networks: Network[] = [];
  wallets: Wallet[] = [];

  selectedNetwork: Network = {} as Network;
  selectedWallet: Wallet = {} as Wallet;

  async getNetworks(): Promise<void> {
    this.networks = await this.networksService.getNetworksByCategory('All');
    const liveNetworks = this.networksService.getNetworksByCategory('Live');
    if (liveNetworks.length > 0) {
      this.networks.push(...liveNetworks);
    }

    this.selectedNetwork = this.networks[0];
  }

  getNetworkByName(name: string): Network[] {
    if (name === "All Networks") {
      return this.networks;
    }

    return this.networks.filter(network => network.name.toLowerCase() === name.toLowerCase());
  }

  async getWallets(): Promise<void> {
    this.wallets = await this.walletsService.getAll();
  }

  getWalletsByNetwork(networkName: string): Wallet[] {
    return this.wallets.filter(wallet => wallet.network.toLowerCase() === networkName.toLowerCase());
  }

  encodePublicAddressByChainFormat(publicKey: string): string {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    return this.polkadotjsService.encodePublicAddressByChainFormat(publicKeyUint8, 42);
  }

  truncateAddress(address: string): string {
    return this.polkadotjsService.truncateAddress(address);
  }

  openSelectNetworkModal() {
    this.selectNetworkModal.present();
  }

  onSelectedNetwork(network: Network) {
    this.selectedNetwork = network;
    this.selectNetworkModal.dismiss();

    this.onFilteredNetwork.emit(network);
  }

  openWalletDetailsModal(wallet: Wallet) {
    this.selectedWallet = wallet;
    this.walletDetailsModal.present();
  }

  async onDeletedWallet() {
    await this.getWallets();
    this.walletDetailsModal.dismiss();
  }

  ngOnInit() {
    this.mainPresentingElement = document.querySelector('.my-wallets');
    this.getNetworks();
    this.getWallets();
  }

  ngOnChanges(changes: SimpleChanges) {
    const wallet = changes['newlyAddedWallet']?.currentValue;
    if (wallet && Object.keys(wallet).length > 0) {
      this.wallets.push(wallet);
    }
  }
}
