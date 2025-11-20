import { Component, OnInit, EventEmitter, Output, Input, ViewChild } from '@angular/core';
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
  IonModal,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonIcon,
  IonContent,
  ToastController,
  ActionSheetController,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { copyOutline } from 'ionicons/icons';

import { Chain } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model';
import { Network } from 'src/models/network.model';

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { AuthService } from 'src/app/api/auth/auth.service';
import { BiometricService } from 'src/app/api/biometric/biometric.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import { PolkadotJsService } from 'src/app/api/polkadot/blockchains/polkadot-js/polkadot-js.service';
import { PolkadotService } from 'src/app/api/polkadot/blockchains/polkadot-js/polkadot/polkadot.service';
import { AssethubPolkadotService } from 'src/app/api/polkadot/blockchains/polkadot-js/assethub-polkadot/assethub-polkadot.service';
import { XodePolkadotService } from 'src/app/api/polkadot/blockchains/polkadot-js/xode-polkadot/xode-polkadot.service';
import { HydrationPolkadotService } from 'src/app/api/polkadot/blockchains/polkadot-js/hydration-polkadot/hydration-polkadot.service';

import { Auth } from 'src/models/auth.model';

import { PasswordSetupComponent } from 'src/app/security/shared/password-setup/password-setup.component';
import { PasswordLoginComponent } from 'src/app/security/shared/password-login/password-login.component';
import { PinSetupComponent } from 'src/app/security/shared/pin-setup/pin-setup.component';
import { PinLoginComponent } from 'src/app/security/shared/pin-login/pin-login.component';
import { BiometricComponent } from 'src/app/security/shared/biometric/biometric.component';

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
    IonModal,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonIcon,
    IonContent,
    PasswordSetupComponent,
    PasswordLoginComponent,
    PinSetupComponent,
    PinLoginComponent,
    BiometricComponent
  ]
})
export class WalletDetailsComponent implements OnInit {
  @ViewChild('confirmShowRecoverySecretsModal', { read: IonModal }) confirmShowRecoverySecretsModal!: IonModal;
  @ViewChild('secretMnemonicRecoveryModal', { read: IonModal }) secretMnemonicRecoveryModal!: IonModal;
  @ViewChild('secretPrivateKeyRecoveryModal', { read: IonModal }) secretPrivateKeyRecoveryModal!: IonModal;

  @Input() wallet: Wallet = new Wallet();

  @Output() onUpdatedWallet = new EventEmitter<boolean>();
  @Output() onDeletedWallet = new EventEmitter<boolean>();

  constructor(
    private environmentService: EnvironmentService,
    private authService: AuthService,
    private biometricService: BiometricService,
    private utilsService: UtilsService,
    private polkadotService: PolkadotService,
    private assethubPolkadotService: AssethubPolkadotService,
    private xodePolkadotService: XodePolkadotService,
    private hydrationPolkadotService: HydrationPolkadotService,
    private walletsService: WalletsService,
    private encryptionService: EncryptionService,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({
      copyOutline,
    });
  }

  isChromeExtension = false;

  currentAuth: Auth | null = null;
  isBiometricAvailable = false;

  walletPublicKey: string = '';
  updateTimeOut: any = null;

  currentWallet: Wallet = new Wallet();
  currentWalletPublicAddress: string = '';

  isProcessing: boolean = false;

  secretRecoveryMode: 'mnemonicPhrase' | 'privateKey' = 'mnemonicPhrase';
  secretMnemonicPhrase: string[] = new Array(12).fill('');
  secretPrivateKey: string = '';

  async copyClipboard(value: string, message: string) {
    await Clipboard.write({ string: value });

    const toast = await this.toastController.create({
      message,
      color: 'success',
      duration: 1500,
      position: 'top',
    });

    await toast.present();
  }

  copyPublicKey() {
    this.copyClipboard(this.walletPublicKey, 'Public key copied to clipboard!');
  }

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

  async initSecurity() {
    const auth = await this.authService.getAuth();
    if (auth) {
      this.currentAuth = auth;
    }

    const availability = await this.biometricService.isAvailable();
    this.isBiometricAvailable = availability.available;
  }

  showRecoverySecrets(mode: 'mnemonicPhrase' | 'privateKey') {
    this.secretRecoveryMode = mode;

    if (mode === 'mnemonicPhrase') {
      if (!this.wallet.mnemonic_phrase || this.wallet.mnemonic_phrase.trim() === '-') {

        this.toastController.create({
          message: 'No Mnemonic phrase available',
          color: 'danger',
          duration: 1500,
          position: 'top'
        }).then(t => t.present());

        return;
      }
    }

    this.confirmShowRecoverySecretsModal.present();
  }

  async confirmSignTransaction(decryptedPassword: string) {
    this.isProcessing = true;

    let service: PolkadotJsService | null = null;

    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 0) service = this.polkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 1000) service = this.assethubPolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 3417) service = this.xodePolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 2034) service = this.hydrationPolkadotService;

    if (!service) return;

    this.confirmShowRecoverySecretsModal.dismiss();

    if (this.secretRecoveryMode === 'mnemonicPhrase') {
      const encryptedMnemonic = this.wallet.mnemonic_phrase;
      const mnemonicPhrase = await this.encryptionService.decrypt(encryptedMnemonic, decryptedPassword);

      this.secretMnemonicPhrase = mnemonicPhrase.trim().split(/\s+/);
      this.secretMnemonicRecoveryModal.present();
    } else {
      const encryptedPrivateKey = this.wallet.private_key;
      const decryptedPrivateKey = await this.encryptionService.decrypt(encryptedPrivateKey, decryptedPassword);
      const privateKeyHex = this.utilsService.encodePrivateKeyToHex(
        new Uint8Array(decryptedPrivateKey.split(',').map(Number) ?? [])
      );

      this.secretPrivateKey = privateKeyHex;
      this.secretPrivateKeyRecoveryModal.present();
    }
  }

  copyMnemonicPhrase() {
    this.copyClipboard(this.secretMnemonicPhrase.join(' '), 'Mnemonic phrase copied to clipboard!');
  }

  copyPrivateKey() {
    this.copyClipboard(this.secretPrivateKey, 'Private key copied to clipboard!');
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

    this.isChromeExtension = this.environmentService.isChromeExtension();
    this.initSecurity();

    this.getCurrentWallet();
  }
}
