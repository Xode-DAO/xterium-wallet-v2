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

import { Network, NetworkMetadata } from 'src/models/network.model';
import { Wallet } from 'src/models/wallet.model'

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';
import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

import { SignWalletComponent } from '../sign-wallet/sign-wallet.component';

@Component({
  selector: 'app-import-seed-phrase',
  templateUrl: './import-seed-phrase.component.html',
  styleUrls: ['./import-seed-phrase.component.scss'],
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
export class ImportSeedPhraseComponent implements OnInit {
  @ViewChild('confirmImportWalletModal', { read: IonModal }) confirmImportWalletModal!: IonModal;

  @Input() selectedNetworkMetadata: NetworkMetadata = new NetworkMetadata();
  @Output() onImportedWallet = new EventEmitter<Wallet>();

  constructor(
    private environmentService: EnvironmentService,
    private utilsService: UtilsService,
    private onboardingService: OnboardingService,
    private encryptionService: EncryptionService,
    private chainsService: ChainsService,
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
  walletMnemonicPhrase: string[] = new Array(12).fill('');

  isProcessing: boolean = false;

  trackByIndex(index: number): number {
    return index;
  }

  trimInput(index: number) {
    this.walletMnemonicPhrase[index] = this.walletMnemonicPhrase[index].trim();
  }

  async pasteFromClipboard() {
    const { type, value } = await Clipboard.read();

    if (type === 'text/plain') {
      if (value.split(' ').length !== 12) {
        const toast = await this.toastController.create({
          message: 'Invalid mnemonic phrase length!',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
      } else {
        this.walletMnemonicPhrase = value.split(' ')
      }
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

    if (this.selectedNetworkMetadata.network === Network.Polkadot) {
      let isMnemonicPhraseValid = await this.utilsService.validateMnemonic(this.walletMnemonicPhrase.join(' '));
      if (!isMnemonicPhraseValid) {
        this.confirmImportWalletModal.dismiss();
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

      const seed: Uint8Array = await this.utilsService.generateMnemonicToMiniSecret(this.walletMnemonicPhrase.join(' '));
      const keypair = await this.utilsService.createKeypairFromSeed(seed);

      let newId = uuidv4();

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

      const chains = this.chainsService.getChainsByNetwork(this.selectedNetworkMetadata.network);
      if (chains.length === 0) {
        this.isProcessing = false;

        const toast = await this.toastController.create({
          message: 'No chains available. Please try again later.',
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
        chain: chains[0],
        mnemonic_phrase: encryptedMnemonicPhrase,
        public_key: keypair.publicKey.toString(),
        private_key: encryptedPrivateKey
      };

      await this.walletsService.create(wallet);

      const wallets = await this.walletsService.getAllWallets();
      if (wallets.length === 1) {
        await this.walletsService.setCurrentWallet(newId);
      }

      for (let i = 1; i < chains.length; i++) {
        newId = uuidv4();

        const wallet: Wallet = {
          id: newId,
          name: this.walletName,
          chain: chains[i],
          mnemonic_phrase: encryptedMnemonicPhrase,
          public_key: keypair.publicKey.toString(),
          private_key: encryptedPrivateKey
        };

        await this.walletsService.create(wallet);
      }

      if (this.isChromeExtension) {
        const newlySavedWallets = await this.walletsService.getAllWallets();
        const encodedWallets = await Promise.all(
          newlySavedWallets.map(async (wallet) => {
            const publicKeyU8a = new Uint8Array(
              wallet.public_key.split(",").map((byte) => Number(byte.trim()))
            );

            return {
              address: await this.utilsService.encodePublicAddressByChainFormat(publicKeyU8a, 0),
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
        message: 'Wallet imported successfully!',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();

      this.onImportedWallet.emit({ ...wallet });
    } else {
      this.confirmImportWalletModal.dismiss();
      this.isProcessing = false;

      const toast = await this.toastController.create({
        message: this.selectedNetworkMetadata.network.toString() + ' network is not yet supported.',
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
