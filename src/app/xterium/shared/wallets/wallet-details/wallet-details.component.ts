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

import { Wallet } from '../../../../../models/wallet.model';

import { PolkadotjsService } from '../../../../api/polkadotjs/polkadotjs.service';
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
  @Output() onDeletedWallet = new EventEmitter<boolean>();

  constructor(
    private polkadotjsService: PolkadotjsService,
    private walletsService: WalletsService,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({
      copyOutline,
    });
  }

  walletPublicKey: string = '';
  updateTimeOut: any = null;

  async encodePublicAddressByChainFormat(publicKey: string): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    return await this.polkadotjsService.encodePublicAddressByChainFormat(publicKeyUint8, 42);
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

  async updateWalletOnModelChange() {
    clearTimeout(this.updateTimeOut);

    this.updateTimeOut = setTimeout(async () => {
      if (this.wallet.name !== "") {
        await this.walletsService.update(this.wallet.private_key, this.wallet);

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
            await this.walletsService.delete(this.wallet.private_key);
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
    this.encodePublicAddressByChainFormat(this.wallet.public_key.toString()).then(encodedAddress => {
      this.walletPublicKey = encodedAddress;
    });
  }
}
