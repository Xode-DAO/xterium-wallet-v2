import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Clipboard } from '@capacitor/clipboard';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

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

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
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
  @Input() wallet: Wallet = new Wallet();

  @Output() onUpdatedWallet = new EventEmitter<boolean>();
  @Output() onDeletedWallet = new EventEmitter<boolean>();

  constructor(
    private utilsService: UtilsService,
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

  currentWallet: Wallet = new Wallet();
  currentWalletPublicAddress: string = '';

  async encodePublicAddressByChainFormat(publicKey: string, chain: Chain): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = typeof chain.address_prefix === 'number' ? chain.address_prefix : 0;
    return await this.utilsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
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
    const walletData = JSON.stringify(this.wallet, null, 2);
    const fileName = `${this.walletPublicKey}.json`;

    if (Capacitor.isNativePlatform()) {
      const base64Data = btoa(unescape(encodeURIComponent(walletData)));

      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true
      });

      let fileUri = result.uri;

      if (Capacitor.getPlatform() === 'android') {
        const fileInfo = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache
        });
        fileUri = fileInfo.uri;
      }

      await Share.share({
        title: this.wallet.name,
        text: 'Wallet backup file',
        url: fileUri,
        dialogTitle: 'Save as JSON'
      });

      const toast = await this.toastController.create({
        message: 'Wallet export shared!',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    } else {
      const blob = new Blob([walletData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const toast = await this.toastController.create({
        message: 'Wallet exported successfully!',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    }
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
