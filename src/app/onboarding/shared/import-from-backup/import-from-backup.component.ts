import { Component, OnInit, Input, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { v4 as uuidv4 } from 'uuid';

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

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';
import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

import { SignWalletComponent } from '../sign-wallet/sign-wallet.component';

@Component({
  selector: 'app-import-from-backup',
  templateUrl: './import-from-backup.component.html',
  styleUrls: ['./import-from-backup.component.scss'],
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
export class ImportFromBackupComponent implements OnInit {
  @ViewChild('confirmImportWalletModal', { read: IonModal }) confirmImportWalletModal!: IonModal;

  @Input() selectedChain: Chain = new Chain();
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
  wallet: Wallet = new Wallet();

  isProcessing: boolean = false;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        this.wallet = Object.assign(new Wallet(), parsed);
      } catch (err) {
        const toast = await this.toastController.create({
          message: 'Invalid file format: ' + err,
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
      }
    };

    reader.readAsText(file);
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
      const decryptedPrivateKey = await this.encryptionService.decrypt(this.wallet.private_key!, password);
      const privateKeyHex = this.utilsService.encodePrivateKeyToHex(
        new Uint8Array(decryptedPrivateKey.split(',').map(Number) ?? [])
      );

      let validatedKeypair = await this.utilsService.validatePrivateKey(privateKeyHex);
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

      if (this.wallet.mnemonic_phrase && this.wallet.mnemonic_phrase !== "") {
        const decryptedMnemonicPhrase = await this.encryptionService.decrypt(this.wallet.mnemonic_phrase, password);

        let isMnemonicPhraseValid = await this.utilsService.validateMnemonic(decryptedMnemonicPhrase);
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

      const wallet: Wallet = {
        id: newId,
        name: this.walletName,
        chain: this.selectedChain,
        mnemonic_phrase: this.wallet.mnemonic_phrase,
        public_key: this.wallet.public_key,
        private_key: this.wallet.private_key,
        derivation_path: this.wallet.derivation_path
      };

      await this.walletsService.create(wallet);

      const wallets = await this.walletsService.getAllWallets();
      if (wallets.length === 1) {
        await this.walletsService.setCurrentWallet(newId);
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
        message: this.selectedChain.network.toString() + ' network is not yet supported.',
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
