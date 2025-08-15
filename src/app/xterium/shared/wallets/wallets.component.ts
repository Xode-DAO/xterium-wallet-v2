import { Component, OnInit, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
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

import { WalletDetailsComponent } from "./wallet-details/wallet-details.component";

import { Wallet } from './../../../../models/wallet.model'

import { PolkadotjsService } from '../../../api/polkadotjs/polkadotjs.service';
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
    IonLabel,
    IonModal,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    WalletDetailsComponent
  ]
})
export class WalletsComponent implements OnInit {
  @ViewChild('walletDetailsModal', { read: IonModal }) walletDetailsModal!: IonModal;
  @Input() newlyAddedWallet: Wallet = {} as Wallet;

  constructor(
    private polkadotjsService: PolkadotjsService,
    private walletsService: WalletsService,
  ) {
    addIcons({
      ellipsisVerticalOutline,
    });
  }

  mainPresentingElement!: HTMLElement | null;

  wallets: Wallet[] = [];
  selectedWallet: Wallet = {} as Wallet;

  async getWallets(): Promise<void> {
    this.wallets = await this.walletsService.getAll();
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
    this.getWallets();
  }

  ngOnChanges(changes: SimpleChanges) {
    const wallet = changes['newlyAddedWallet']?.currentValue;
    if (wallet && Object.keys(wallet).length > 0) {
      this.wallets.push(wallet);
    }
  }
}
