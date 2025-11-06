import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Clipboard } from '@capacitor/clipboard';
import {
  IonButton,
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

import { Chain } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model';

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

@Component({
  selector: 'app-wallet-details',
  templateUrl: './wallet-details.component.html',
  styleUrls: ['./wallet-details.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
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
    private polkadotJsService: PolkadotJsService,
    private chainsService: ChainsService,
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

  currentWallet: Wallet = {} as Wallet;
  currentWalletPublicAddress: string = '';

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

  async copyToClipboard() {
    await Clipboard.write({
      string: this.walletPublicKey
    });

    const toast = await this.toastController.create({
      message: 'Public key copied to clipboard!',
      color: 'success',
      duration: 1500,
      position: 'top',
    });

    await toast.present();
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

  async exportWallet() {
    const walletData = JSON.stringify(this.wallet);
    const blob = new Blob([walletData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.walletPublicKey}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    this.encodePublicAddressByChainFormat(this.wallet.public_key, this.wallet.chain).then(encodedAddress => {
      this.walletPublicKey = encodedAddress;
    });

    this.getCurrentWallet();
  }
}
