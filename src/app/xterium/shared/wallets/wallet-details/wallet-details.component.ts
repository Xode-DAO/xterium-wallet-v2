import { Component, OnInit, EventEmitter, Output, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { u8aToHex, hexToU8a } from '@polkadot/util';

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
  IonCard,
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
import { ClipboardService } from 'src/app/api/clipboard/clipboard.service';

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
    IonCard,
    PasswordSetupComponent,
    PasswordLoginComponent,
    PinSetupComponent,
    PinLoginComponent,
    BiometricComponent
  ]
})
export class WalletDetailsComponent implements OnInit {
  @ViewChild('confirmSignTransactionModal', { read: IonModal }) confirmSignTransactionModal!: IonModal;
  @ViewChild('mnemonicRecoveryModal', { read: IonModal }) mnemonicRecoveryModal!: IonModal;
  @ViewChild('privateKeyRecoveryModal', { read: IonModal }) privateKeyRecoveryModal!: IonModal;

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
    private actionSheetController: ActionSheetController,
    private clipboardService: ClipboardService
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

  walletMnemonicPhrase: string[] = new Array(12).fill('');
  privateKey: string = '';

  recoveryMode: 'mnemonicPhrase' | 'privateKey' = 'mnemonicPhrase';

  copyPublicKey() {
    this.clipboardService.copy(this.walletPublicKey, 'Public key copied to clipboard!');
  }
  copyMnemonicPhrase() {
    this.clipboardService.copy(this.walletMnemonicPhrase.join(' '), 'Mnemonic phrase copied to clipboard!');
  }

  copyPrivateKey() {
    this.clipboardService.copy(this.privateKey, 'Private key copied to clipboard!');
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

  signTransactions(mode: 'mnemonicPhrase' | 'privateKey') {
    this.recoveryMode = mode;

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

    this.confirmSignTransactionModal.present();
  }

  async confirmSignTransaction(decryptedPassword: string) {
    this.isProcessing = true;
    
    let service: PolkadotJsService | null = null;

    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 0) service = this.polkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 1000) service = this.assethubPolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 3417) service = this.xodePolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 2034) service = this.hydrationPolkadotService;

    if (!service) return;

    this.confirmSignTransactionModal.dismiss();

    if (this.recoveryMode === 'mnemonicPhrase') {
      const encryptedMnemonic = this.wallet.mnemonic_phrase;

      const mnemonicPhrase = await this.encryptionService.decrypt(
        encryptedMnemonic,
        decryptedPassword
      );

      this.walletMnemonicPhrase = mnemonicPhrase.trim().split(/\s+/);

      this.mnemonicRecoveryModal.present();
    } else {
      const encryptedPrivateKey = this.wallet.private_key;

      let privateKey = await this.encryptionService.decrypt(
        encryptedPrivateKey,
        decryptedPassword
      );

      let privateKeyU8: Uint8Array;
      if (privateKey.includes(",")) {
        privateKeyU8 = new Uint8Array(
          privateKey.split(",").map(x => Number(x.trim()))
        );
      } else {
        privateKeyU8 = hexToU8a(privateKey);
      }

      const privateKeyHex = u8aToHex(privateKeyU8);

      this.privateKey = privateKeyHex;
      this.privateKeyRecoveryModal.present();
    }
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
