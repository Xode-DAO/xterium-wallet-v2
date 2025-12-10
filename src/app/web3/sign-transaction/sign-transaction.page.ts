import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiPromise } from '@polkadot/api';
import { ISubmittableResult } from '@polkadot/types/types';
import { App } from '@capacitor/app';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonText,
  IonLabel,
  IonAvatar,
  IonButton,
  IonButtons,
  IonCard,
  IonFooter,
  IonIcon,
  IonChip,
  IonSpinner,
  IonModal,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  cube,
  cubeOutline,
  arrowUpOutline,
  arrowDownOutline,
  globeOutline,
  flame
} from 'ionicons/icons';

import { Network } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';
import { Wallet, WalletSigner } from 'src/models/wallet.model';

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { AuthService } from 'src/app/api/auth/auth.service';
import { BiometricService } from 'src/app/api/biometric/biometric.service';
import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { PolkadotJsService } from 'src/app/api/polkadot/blockchains/polkadot-js/polkadot-js.service';
import { PolkadotService } from 'src/app/api/polkadot/blockchains/polkadot-js/polkadot/polkadot.service';
import { AssethubPolkadotService } from 'src/app/api/polkadot/blockchains/polkadot-js/assethub-polkadot/assethub-polkadot.service';
import { XodePolkadotService } from 'src/app/api/polkadot/blockchains/polkadot-js/xode-polkadot/xode-polkadot.service';
import { HydrationPolkadotService } from 'src/app/api/polkadot/blockchains/polkadot-js/hydration-polkadot/hydration-polkadot.service';
import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { BalancesService } from 'src/app/api/balances/balances.service';
import { LocalNotificationsService } from 'src/app/api/local-notifications/local-notifications.service';

import { Auth } from 'src/models/auth.model';

import { PasswordSetupComponent } from 'src/app/security/shared/password-setup/password-setup.component';
import { PasswordLoginComponent } from 'src/app/security/shared/password-login/password-login.component';
import { PinSetupComponent } from 'src/app/security/shared/pin-setup/pin-setup.component';
import { PinLoginComponent } from 'src/app/security/shared/pin-login/pin-login.component';
import { BiometricComponent } from 'src/app/security/shared/biometric/biometric.component';

@Component({
  selector: 'app-sign-transaction',
  templateUrl: './sign-transaction.page.html',
  styleUrls: ['./sign-transaction.page.scss'],
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
    IonText,
    IonLabel,
    IonAvatar,
    IonButton,
    IonButtons,
    IonCard,
    IonFooter,
    IonIcon,
    IonChip,
    IonSpinner,
    IonModal,
    IonTitle,
    IonToolbar,
    PasswordSetupComponent,
    PasswordLoginComponent,
    PinSetupComponent,
    PinLoginComponent,
    BiometricComponent
  ],
})
export class SignTransactionPage implements OnInit {
  @ViewChild('confirmSignTransactionModal', { read: IonModal }) confirmSignTransactionModal!: IonModal;
  @ViewChild('walletCheckingModal', { read: IonModal }) walletCheckingModal!: IonModal;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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
    private balancesService: BalancesService,
    private localNotificationsService: LocalNotificationsService,
    private toastController: ToastController,
  ) {
    addIcons({
      cube,
      cubeOutline,
      arrowUpOutline,
      arrowDownOutline,
      globeOutline,
      flame
    });
  }

  pjsApi!: ApiPromise;

  isChromeExtension = false;

  currentAuth: Auth | null = null;
  isBiometricAvailable = false;

  currentWallet: Wallet = new Wallet();
  currentWalletPublicAddress: string = '';

  encodedCallDataHex: string = "";

  extrinsic: string = "";
  estimatedFee: number = 0;
  isLoadingFee: boolean = true;

  isProcessing: boolean = false;

  callBackUrl: string = "";

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

  truncateAddress(address: string): string {
    return this.utilsService.truncateAddress(address);
  }

  formatBalance(amount: number, decimals: number): number {
    return this.balancesService.formatBalance(amount, decimals);
  }

  async initSecurity() {
    const auth = await this.authService.getAuth();
    if (auth) {
      this.currentAuth = auth;
    }

    const availability = await this.biometricService.isAvailable();
    this.isBiometricAvailable = availability.available;
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 10000,
      position: 'bottom',
      color: 'primary'
    });
    toast.present();
  }

  async initTransaction(): Promise<void> {
    await this.getCurrentWallet();

    this.route.queryParams.subscribe(async params => {
      if (params['encodedCallDataHex']) {
        this.encodedCallDataHex = params['encodedCallDataHex'];

        if (params['callback']) {
          this.callBackUrl = decodeURIComponent(params['callback']);
        }

        if (params['wallet']) {
          this.currentWalletPublicAddress = decodeURIComponent(params['callback']);
        }

        let service: PolkadotJsService | null = null;

        if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 0) service = this.polkadotService;
        if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 1000) service = this.assethubPolkadotService;
        if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 3417) service = this.xodePolkadotService;
        if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 2034) service = this.hydrationPolkadotService;

        if (!service) return;

        this.pjsApi = await service.connect();
        const extrinsic = this.pjsApi.registry.createType('Extrinsic', this.encodedCallDataHex);

        this.extrinsic = `${extrinsic.method.section}(${extrinsic.method.method})`;

        const estimatedFee = await service.estimatedFees(this.pjsApi, this.encodedCallDataHex, this.currentWalletPublicAddress, null);

        this.estimatedFee = estimatedFee;
        this.isLoadingFee = false;
      }
    });
  }

  async checkCurrentWallet(): Promise<boolean> {
    const currentWallet = await this.walletsService.getCurrentWallet();
  
    if (!currentWallet || !currentWallet.public_key || currentWallet.public_key.trim() === '') {
      this.walletCheckingModal.present();
      return false;
    }

    return true;
  }

  navigateToOnboarding(modal: IonModal) {
    modal.dismiss();
    this.router.navigate(['/onboarding']);
  }

  async signTransactions() {
    await this.checkCurrentWallet()
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

    const decryptedMnemonicPhrase = await this.encryptionService.decrypt(this.currentWallet.mnemonic_phrase, decryptedPassword);
    const decryptedPrivateKey = await this.encryptionService.decrypt(this.currentWallet.private_key, decryptedPassword);
    const walletSigner: WalletSigner = {
      mnemonic_phrase: decryptedMnemonicPhrase,
      public_key: this.currentWallet.public_key,
      private_key: decryptedPrivateKey
    };

    if (this.callBackUrl) {
      const signedHex = await service.signTransaction(
        this.pjsApi,
        this.encodedCallDataHex,
        walletSigner
      );
  
      this.confirmSignTransactionModal.dismiss();
  
      const url = `${this.callBackUrl}?status=signed&signedTx=${encodeURIComponent(signedHex)}`;

      window.location.href = url;
      App.exitApp();
      return;
    }

    service.signAndSubmitTransaction(this.pjsApi, this.encodedCallDataHex, walletSigner).subscribe({
      next: async (event) => {
        this.confirmSignTransactionModal.dismiss();

        this.router.navigate(['/xterium/balances']);
        this.handleTransactionEvent(event);
      },
      error: async (err) => {
        this.isProcessing = false;
      }
    });
  }

  async handleTransactionEvent(event: ISubmittableResult) {
    let title = '';
    let body = '';

    const eventStatus = event.status.type.toString();
    const txHashValue = event.txHash.toHex();
    const shortTxHash = `${txHashValue.slice(0, 6)}...${txHashValue.slice(-4)}`;

    switch (eventStatus) {
      case "Broadcast":
        title = "📤 Sending Your Transaction";
        body = `We’re starting to send your transaction. It’s on its way and will be processed shortly.\nRef: ${shortTxHash}`;
        break;

      case "InBlock":
        title = "✅ Transaction Sent";
        body = `Your transaction has been successfully sent and is now reflected in your account. You can check your updated balance.\nRef: ${shortTxHash}`;
        break;

      case "Finalized":
        title = "🎉 Transaction Completed";
        body = `Everything is finalized! Your transaction is fully confirmed and recorded. No further action is needed.\nRef: ${shortTxHash}`;
        break;

      default:
        title = "⏳ Processing";
        body = `We’re still working on your transaction. Please hold on a moment while we complete the process.\nRef: ${shortTxHash}`;
    }

    const id = Math.floor(Math.random() * 100000);
    await this.localNotificationsService.presentNotification(title, body, id);
  }

  cancelTransaction() {
    this.router.navigate(['/xterium/balances']);
  }

  ngOnInit() {
    this.isChromeExtension = this.environmentService.isChromeExtension();
    this.initSecurity();

    this.initTransaction();
    this.checkCurrentWallet()

  }
}
