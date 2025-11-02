import { Component, OnInit, Input, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { v4 as uuidv4 } from 'uuid';

import { Clipboard } from '@capacitor/clipboard';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonIcon,
  IonToast,
  IonModal,
  IonTitle,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, copyOutline, close } from 'ionicons/icons';

import { Network } from 'src/models/network.model';
import { Wallet } from 'src/models/wallet.model'

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';
import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

import { SignWalletComponent } from '../sign-wallet/sign-wallet.component';

@Component({
  selector: 'app-new-wallet',
  templateUrl: './new-wallet.component.html',
  styleUrls: ['./new-wallet.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonButtons,
    IonIcon,
    IonToast,
    IonModal,
    IonTitle,
    IonToolbar,
    SignWalletComponent,
  ]
})
export class NewWalletComponent implements OnInit {
  @ViewChild('confirmSaveWalletModal', { read: IonModal }) confirmSaveWalletModal!: IonModal;

  @Input() selectedNetwork: Network = {} as Network;
  @Output() onCreatedWallet = new EventEmitter<Wallet>();

  constructor(
    private environmentService: EnvironmentService,
    private polkadotJsService: PolkadotJsService,
    private onboardingService: OnboardingService,
    private encryptionService: EncryptionService,
    private walletsService: WalletsService,
    private toastController: ToastController
  ) {
    addIcons({
      arrowBackOutline,
      copyOutline,
      close
    });
  }

  isChromeExtension = false;

  walletName: string = '';
  walletMnemonicPhrase: string[] = new Array(12).fill('');

  isProcessing: boolean = false;

  async copyToClipboard() {
    const mnemonic = this.walletMnemonicPhrase.join(' ');

    await Clipboard.write({
      string: mnemonic
    });

    const toast = await this.toastController.create({
      message: 'Mnemonic phrase copied to clipboard!',
      color: 'success',
      duration: 1500,
      position: 'top',
    });

    await toast.present();
  }

  async saveWallet() {
    if (this.walletName === "") {
      const toast = await this.toastController.create({
        message: 'Wallet name is required!',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    this.confirmSaveWalletModal.present();
  }

  async onSignWallet(password: string) {
    this.isProcessing = true;

    if (this.selectedNetwork.id === 1 || this.selectedNetwork.id === 2) {
      let isMnemonicPhraseValid = await this.polkadotJsService.validateMnemonic(this.walletMnemonicPhrase.join(' '));
      if (!isMnemonicPhraseValid) {
        this.confirmSaveWalletModal.dismiss();
        this.isProcessing = false;

        const toast = await this.toastController.create({
          message: 'Invalid mnemonic phrase!',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
        return;
      }

      const seed: Uint8Array = await this.polkadotJsService.generateMnemonicToMiniSecret(this.walletMnemonicPhrase.join(' '));
      const keypair = await this.polkadotJsService.createKeypairFromSeed(seed);

      const newId = uuidv4();

      let getExistingWallet = await this.walletsService.getWalletById(newId);
      if (getExistingWallet) {
        this.confirmSaveWalletModal.dismiss();
        this.isProcessing = false;

        const toast = await this.toastController.create({
          message: 'Wallet already exists!',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
        return;
      }

      const encryptedMnemonicPhrase = await this.encryptionService.encrypt(this.walletMnemonicPhrase.join(' '), password);
      const encryptedPrivateKey = await this.encryptionService.encrypt(keypair.secretKey.toString(), password);

      const wallet: Wallet = {
        id: newId,
        name: this.walletName,
        network_id: this.selectedNetwork.id,
        mnemonic_phrase: encryptedMnemonicPhrase,
        public_key: keypair.publicKey.toString(),
        private_key: encryptedPrivateKey,
      };

      await this.walletsService.create(wallet);
      this.onCreatedWallet.emit({ ...wallet });

      const wallets = await this.walletsService.getAllWallets();
      if (wallets.length === 1) {
        await this.walletsService.setCurrentWallet(newId);
      }

      if (this.isChromeExtension) {
        const encodedWallets = await Promise.all(
          wallets.map(async (wallet) => {
            const publicKeyU8a = new Uint8Array(
              wallet.public_key.split(",").map((byte) => Number(byte.trim()))
            );

            return {
              address: await this.polkadotJsService.encodePublicAddressByChainFormat(publicKeyU8a, 0),
              name: wallet.name,
            };
          })
        );

        chrome.storage.local.set({ accounts: encodedWallets });
      }

      const onboarding = await this.onboardingService.get();
      if (onboarding) {
        if (onboarding.step3_created_wallet === null && onboarding.step4_completed == false) {
          await this.onboardingService.update({ step3_created_wallet: wallet, step4_completed: true });
        }
      }

      const toast = await this.toastController.create({
        message: 'Wallet created successfully!',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    } else if (this.selectedNetwork.id === 3) {
      this.confirmSaveWalletModal.dismiss();
      this.isProcessing = false;

      const toast = await this.toastController.create({
        message: this.selectedNetwork.name + ' network is not yet supported.',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    } else {

    }
  }

  ngOnInit() {
    this.isChromeExtension = this.environmentService.isChromeExtension();

    this.polkadotJsService.generateMnemonic().then(mnemonicPhrase => {
      this.walletMnemonicPhrase = mnemonicPhrase.split(' ');
    });
  }
}
