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

import { Network } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model'

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';
import { EncryptionService } from 'src/app/api/encryption/encryption.service';
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

  @Input() selectedChain: Chain = new Chain();
  @Output() onImportedWallet = new EventEmitter<Wallet>();

  constructor(
    private utilsService: UtilsService,
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

  walletName: string = '';
  walletMnemonicPhrase: string[] = new Array(12).fill('');
  derivationPath: string | null = null;

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
      const parts = value.split('//');
      const mnemonicPhrase = parts[0].trim();
      const derivationPath = parts.length > 1 ? '//' + parts.slice(1).join('//') : '';

      const words = mnemonicPhrase.split(' ').filter(word => word.length > 0);

      if (words.length !== 12) {
        const toast = await this.toastController.create({
          message: 'Invalid mnemonic phrase length! Expected 12 words.',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
      } else {
        this.walletMnemonicPhrase = words;
        this.derivationPath = derivationPath;

        if (derivationPath) {
          const toast = await this.toastController.create({
            message: `Derivation path detected: ${derivationPath}`,
            color: 'primary',
            duration: 2000,
            position: 'top',
          });
          await toast.present();
        }
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

    if (this.selectedChain.network === Network.Polkadot ||
      this.selectedChain.network === Network.Paseo ||
      this.selectedChain.network === Network.Rococo) {
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

      let keypair;

      if (!this.derivationPath) {
        const seed: Uint8Array = await this.utilsService.generateMnemonicToMiniSecret(this.walletMnemonicPhrase.join(' '));
        keypair = await this.utilsService.createKeypairFromSeed(seed);
      } else {
        keypair = await this.utilsService.deriveKeypair(this.walletMnemonicPhrase.join(' '), this.derivationPath);
      }

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

      const encryptedMnemonicPhrase = await this.encryptionService.encrypt(this.walletMnemonicPhrase.join(' '), password);
      const encryptedPrivateKey = await this.encryptionService.encrypt(keypair.secretKey.toString(), password);

      const wallet: Wallet = {
        id: newId,
        name: this.walletName,
        chain: this.selectedChain,
        mnemonic_phrase: encryptedMnemonicPhrase,
        public_key: keypair.publicKey.toString(),
        private_key: encryptedPrivateKey,
        derivation_path: this.derivationPath
      };

      await this.walletsService.create(wallet);

      const wallets = await this.walletsService.getAllWallets();
      if (wallets.length === 1) {
        await this.walletsService.setCurrentWallet(newId);
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
        message: this.selectedChain.network.toString() + ' network is not yet supported.',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    }
  }

  ngOnInit() { }
}
