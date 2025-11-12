import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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

import { Chain, Network } from 'src/models/chain.model';
import { Wallet, WalletSigner } from 'src/models/wallet.model';

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { AuthService } from 'src/app/api/auth/auth.service';
import { BiometricService } from 'src/app/api/biometric/biometric.service';
import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { PolkadotApiService } from 'src/app/api/polkadot-api/polkadot-api.service';
import { PolkadotService } from 'src/app/api/polkadot-api/polkadot/polkadot.service';
import { AssethubPolkadotService } from 'src/app/api/polkadot-api/assethub-polkadot/assethub-polkadot.service';
import { XodePolkadotService } from 'src/app/api/polkadot-api/xode-polkadot/xode-polkadot.service';
import { HydrationService } from 'src/app/api/polkadot-api/hydration/hydration.service';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private environmentService: EnvironmentService,
    private authService: AuthService,
    private biometricService: BiometricService,
    private polkadotJsService: PolkadotJsService,
    private polkadotService: PolkadotService,
    private assethubPolkadotService: AssethubPolkadotService,
    private xodePolkadotService: XodePolkadotService,
    private hydrationService: HydrationService,
    private walletsService: WalletsService,
    private encryptionService: EncryptionService,
    private balancesService: BalancesService,
    private localNotificationsService: LocalNotificationsService,
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

  async encodePublicAddressByChainFormat(publicKey: string, chain: Chain): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = typeof chain.address_prefix === 'number' ? chain.address_prefix : 0;
    return await this.polkadotJsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  async getCurrentWallet(): Promise<void> {
    const currentWallet = await this.walletsService.getCurrentWallet();
    if (currentWallet) {
      this.currentWallet = currentWallet;
      this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, this.currentWallet.chain)
    }
  }

  truncateAddress(address: string): string {
    return this.polkadotJsService.truncateAddress(address);
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

  async initTransaction(): Promise<void> {
    await this.getCurrentWallet();

    this.route.queryParams.subscribe(params => {
      if (params['encodedCallDataHex']) {
        this.encodedCallDataHex = params['encodedCallDataHex'];

        let service: PolkadotApiService | null = null;

        if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 0) service = this.polkadotService;
        if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 1000) service = this.assethubPolkadotService;
        if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 3417) service = this.xodePolkadotService;
        if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 2034) service = this.hydrationService;

        if (!service) return;

        service.decodeCallData(this.encodedCallDataHex).then(async (transactionInfo) => {
          this.extrinsic = transactionInfo.decodedCall.type + "." + transactionInfo.decodedCall.value.type;
          setTimeout(async () => {
            const fee = await transactionInfo.getPaymentInfo(this.currentWalletPublicAddress);

            this.estimatedFee = Number(fee.partial_fee);
            this.isLoadingFee = false;
          }, 1000);
        });
      }
    });
  }

  signTransactions() {
    this.confirmSignTransactionModal.present();
  }

  async confirmSignTransaction(decryptedPassword: string) {
    this.isProcessing = true;

    let service: PolkadotApiService | null = null;

    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 0) service = this.polkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 1000) service = this.assethubPolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 3417) service = this.xodePolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 2034) service = this.hydrationService;

    if (!service) return;

    const decryptedPrivateKey = await this.encryptionService.decrypt(this.currentWallet.private_key, decryptedPassword);
    const walletSigner: WalletSigner = {
      public_key: this.currentWallet.public_key,
      private_key: decryptedPrivateKey
    };

    service.signAndSubmitTransaction(this.encodedCallDataHex, walletSigner).subscribe({
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

  async handleTransactionEvent(event: any) {
    let title = '';
    let body = '';

    const hashInfo = event.txHash ? `\nTx Hash: ${event.txHash}` : '';

    switch (event.type) {
      case "signed":
        title = "Transaction Signed";
        body = `Your transfer request has been signed and is ready to be sent.${hashInfo}`;
        break;

      case "broadcasted":
        title = "Transaction Sent";
        body = `Your transfer has been broadcasted to the chain.${hashInfo}`;
        break;

      case "txBestBlocksState":
        if (event.found) {
          title = "Transaction Included in Block";

          const eventMessages = event.events.map((e: any, idx: number) => {
            if (e.type === "ExtrinsicSuccess") return `Step ${idx + 1}: Transfer succeeded.`;
            if (e.type === "ExtrinsicFailed") return `Step ${idx + 1}: Transfer failed.`;
            return `Step ${idx + 1}: ${e.type} event detected.`;
          });

          body = `Your transaction is included in a block.${hashInfo}\n` + eventMessages.join("\n");
        }
        break;

      case "finalized":
        title = "Transaction Completed";
        body = `Your transfer is now finalized and confirmed on the blockchain.${hashInfo}`;
        break;

      default:
        title = "Transaction Update";
        body = `Received event: ${event.type}${hashInfo}`;
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
  }
}
