import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonLabel,
  IonToast,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, copyOutline, close } from 'ionicons/icons';

import { Wallet } from './../../../../models/wallet.model'

import { PolkadotjsService } from '../../../api/polkadotjs/polkadotjs.service';
import { WalletsService } from './../../../api/wallets/wallets.service';

@Component({
  selector: 'app-new-wallet',
  templateUrl: './new-wallet.component.html',
  styleUrls: ['./new-wallet.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonInput,
    IonLabel,
    IonToast,
  ]
})
export class NewWalletComponent implements OnInit {
  @Output() onWalletCreated = new EventEmitter<Wallet>();

  constructor(
    private polkadotjsService: PolkadotjsService,
    private walletsService: WalletsService,
    private toastController: ToastController
  ) {
    addIcons({
      arrowBackOutline,
      copyOutline,
      close
    });
  }

  walletName: string = '';
  walletNetwork: string = 'Polkadot'; // this should be an object. Get from preferences
  walletMnemonicPhrase: string[] = new Array(12).fill('');

  isProcessing: boolean = false;

  async copyToClipboard() {
    const mnemonic = this.walletMnemonicPhrase.join(' ');

    navigator.clipboard.writeText(mnemonic).then(async () => {
      const toast = await this.toastController.create({
        message: 'Mnemonic phrase copied to clipboard!',
        color: 'success',
        duration: 1500,
        position: 'bottom',
      });

      await toast.present();
    });
  }

  async saveWallet() {
    if (this.walletName === "") {
      const toast = await this.toastController.create({
        message: 'Wallet name is required!',
        color: 'warning',
        duration: 1500,
        position: 'bottom',
      });

      await toast.present();

      return;
    }

    this.isProcessing = true;

    let isMnemonicPhraseValid = this.polkadotjsService.validateMnemonic(this.walletMnemonicPhrase.join(' '));
    if (isMnemonicPhraseValid) {
      const seed: Uint8Array = this.polkadotjsService.generateMnemonicToMiniSecret(this.walletMnemonicPhrase.join(' '));
      const keypair = this.polkadotjsService.createKeypairFromSeed(seed);

      const wallet: Wallet = {
        name: this.walletName,
        network: this.walletNetwork,
        mnemonic_phrase: this.walletMnemonicPhrase.join(' '),
        public_key: keypair.publicKey.toString(),
        private_key: keypair.secretKey.toString()
      };

      let getExistingPublicAddress = await this.walletsService.getByPrivateKey(keypair.secretKey.toString());
      if (getExistingPublicAddress) {
        this.isProcessing = false;

        const toast = await this.toastController.create({
          message: 'Wallet with this private key already exists!',
          color: 'danger',
          duration: 1500,
          position: 'bottom',
        });

        await toast.present();
      } else {
        await this.walletsService.create(wallet);
        this.onWalletCreated.emit({ ...wallet });

        const toast = await this.toastController.create({
          message: 'Wallet created successfully!',
          color: 'success',
          duration: 1500,
          position: 'bottom',
        });

        await toast.present();
      }
    }
  }

  ngOnInit() {
    let mnemonicPhrase = this.polkadotjsService.generateMnemonic();
    this.walletMnemonicPhrase = mnemonicPhrase.split(' ');
  }
}
