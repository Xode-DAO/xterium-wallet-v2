import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonInput,
  IonTextarea,
  IonLabel,
  IonToast,
  ToastController,
  ActionSheetController,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { copyOutline } from 'ionicons/icons';

import { Network } from '../../../../../models/network.model';
import { Wallet } from '../../../../../models/wallet.model';

import { PolkadotjsService } from '../../../../api/polkadotjs/polkadotjs.service';
import { NetworksService } from './../../../../api/networks/networks.service';
import { WalletsService } from './../../../../api/wallets/wallets.service';

@Component({
  selector: 'app-wallet-details',
  templateUrl: './wallet-details.component.html',
  styleUrls: ['./wallet-details.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonInput,
    IonTextarea,
    IonLabel,
    IonToast,
  ]
})
export class WalletDetailsComponent implements OnInit {
  @Input() wallet: Wallet = {} as Wallet;

  @Output() onUpdatedWallet = new EventEmitter<boolean>();
  @Output() onDeletedWallet = new EventEmitter<boolean>();

  constructor(
    private polkadotjsService: PolkadotjsService,
    private networksService: NetworksService,
    private walletsService: WalletsService,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({
      copyOutline,
    });
  }

  walletPublicKey: string = '';
  walletNetwork: Network = {} as Network;
  updateTimeOut: any = null;

  currentWallet: Wallet = {} as Wallet;

  getWalletNetwork(): void {
    const network = this.networksService.getNetworkById(this.wallet.network_id);
    if (network) {
      this.walletNetwork = network;
    }
  }

  async encodePublicAddressByChainFormat(publicKey: string, network: Network): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = typeof network.address_prefix === 'number' ? network.address_prefix : 0;
    return await this.polkadotjsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  async copyToClipboard() {
    navigator.clipboard.writeText(this.walletPublicKey).then(async () => {
      const toast = await this.toastController.create({
        message: 'Public key copied to clipboard!',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    });
  }

  async getCurrentWallet(): Promise<void> {
    const currentWallet = await this.walletsService.getCurrentWallet();
    if (currentWallet) {
      this.currentWallet = currentWallet;
    }
  }

  async updateWalletOnModelChange() {
    clearTimeout(this.updateTimeOut);

    this.updateTimeOut = setTimeout(async () => {
      if (this.wallet.name !== "") {
        await this.walletsService.update(this.wallet.id, this.wallet);
        this.onUpdatedWallet.emit(true);

        const toast = await this.toastController.create({
          message: 'Wallet updated successfully!',
          color: 'success',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
      } else {
        const toast = await this.toastController.create({
          message: 'Wallet name is required!',
          color: 'warning',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
      }
    }, 1000);
  }

  async deleteWallet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Are you sure you want to delete?',
      subHeader: 'This action cannot be undone.',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          data: {
            action: 'delete',
          },
          handler: async () => {
            await this.getCurrentWallet();

            if (this.currentWallet.id === this.wallet.id) {
              const toast = await this.toastController.create({
                message: 'You cannot delete your current wallet!',
                color: 'warning',
                duration: 1500,
                position: 'top',
              });

              await toast.present();
            } else {
              await this.walletsService.delete(this.wallet.id);
              this.onDeletedWallet.emit(true);

              actionSheet.dismiss();

              const toast = await this.toastController.create({
                message: 'Wallet deleted successfully!',
                color: 'success',
                duration: 1500,
                position: 'top',
              });

              await toast.present();
            }
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          data: {
            action: 'cancel',
          },
        },
      ],
    });

    await actionSheet.present();
  }

  ngOnInit() {
    this.getWalletNetwork();
    this.encodePublicAddressByChainFormat(this.wallet.public_key, this.walletNetwork).then(encodedAddress => {
      this.walletPublicKey = encodedAddress;
    });

    this.getCurrentWallet();
  }
}
