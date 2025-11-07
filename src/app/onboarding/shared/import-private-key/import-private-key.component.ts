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
import { arrowBackOutline, clipboardOutline, close } from 'ionicons/icons';

import { Chain, Network } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model'

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';
import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

import { SignWalletComponent } from '../sign-wallet/sign-wallet.component';

@Component({
  selector: 'app-import-private-key',
  templateUrl: './import-private-key.component.html',
  styleUrls: ['./import-private-key.component.scss'],
  standalone: true,
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
    SignWalletComponent
  ]
})
export class ImportPrivateKeyComponent implements OnInit {
  @ViewChild('confirmImportWalletModal', { read: IonModal }) confirmImportWalletModal!: IonModal;

  @Input() selectedChain: Chain = new Chain();
  @Output() onImportedWallet = new EventEmitter<Wallet>();

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
      clipboardOutline,
      close
    });
  }

  isChromeExtension = false;

  walletName: string = '';
  privateKey: string = '';

  isProcessing: boolean = false;

  async pasteFromClipboard() {
    const { type, value } = await Clipboard.read();

    if (type === 'text/plain') {
      this.privateKey = value;
    }
  }

  async importWallet() {
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

    this.confirmImportWalletModal.present();
  }

  async onSignWallet(password: string) {
    this.isProcessing = true;

    if (this.selectedChain.network === Network.Polkadot) {
      let validatedKeypair = await this.polkadotJsService.validatePrivateKey(this.privateKey);
      if (validatedKeypair && !validatedKeypair.valid) {
        this.confirmImportWalletModal.dismiss();
        this.isProcessing = false;

        const toast = await this.toastController.create({
          message: 'Invalid private key: ' + validatedKeypair.error,
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
        return;
      }

      const keypair = validatedKeypair;
      const newId = uuidv4();

      let getExistingWallet = await this.walletsService.getWalletById(newId);
      if (getExistingWallet) {
        this.confirmImportWalletModal.dismiss();
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

      const encryptedPrivateKey = await this.encryptionService.encrypt(keypair.secretKey!.toString(), password);

      const wallet: Wallet = {
        id: newId,
        name: this.walletName,
        chain: this.selectedChain,
        mnemonic_phrase: "-",
        public_key: keypair.publicKey!.toString(),
        private_key: encryptedPrivateKey
      };

      await this.walletsService.create(wallet);
      this.onImportedWallet.emit({ ...wallet });

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

      this.confirmImportWalletModal.dismiss();

      const toast = await this.toastController.create({
        message: 'Wallet imported successfully!',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    } else {
      this.confirmImportWalletModal.dismiss();
      this.isProcessing = false;

      const toast = await this.toastController.create({
        message: this.selectedChain.name + ' chain is not yet supported.',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    }
  }

  ngOnInit() {
    this.isChromeExtension = this.environmentService.isChromeExtension();
  }
}
