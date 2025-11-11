import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subscription } from 'rxjs';

import { Clipboard } from '@capacitor/clipboard';
import {
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonList,
  IonLabel,
  IonAvatar,
  IonInput,
  IonTextarea,
  IonButtons,
  IonToast,
  IonModal,
  IonContent,
  IonTitle,
  IonToolbar,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { clipboardOutline, scanOutline, chevronDownOutline, close } from 'ionicons/icons';

import { Balance } from 'src/models/balance.model';
import { Wallet } from 'src/models/wallet.model';
import { Chain, Network } from 'src/models/chain.model';

import { BalancesService } from 'src/app/api/balances/balances.service';
import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { PolkadotApiService } from 'src/app/api/polkadot-api/polkadot-api.service';
import { PolkadotService } from 'src/app/api/polkadot-api/polkadot/polkadot.service';
import { AssethubPolkadotService } from 'src/app/api/polkadot-api/assethub-polkadot/assethub-polkadot.service';
import { XodePolkadotService } from 'src/app/api/polkadot-api/xode-polkadot/xode-polkadot.service';
import { HydrationService } from 'src/app/api/polkadot-api/hydration/hydration.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { MultipayxApiService } from 'src/app/api/multipayx-api/multipayx-api.service';

import { ChainsComponent } from '../chains/chains.component';
import { Router } from '@angular/router';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { EnvironmentService } from 'src/app/api/environment/environment.service';

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonList,
    IonLabel,
    IonAvatar,
    IonInput,
    IonTextarea,
    IonButtons,
    IonToast,
    IonModal,
    IonContent,
    IonTitle,
    IonToolbar,
    ChainsComponent
  ]
})
export class SendComponent implements OnInit {
  @Input() balance: Balance = new Balance();

  @Output() onClickSend = new EventEmitter<string>();
  @Output() onSendSuccessful = new EventEmitter<string>();

  @ViewChild('selectChainModal', { read: IonModal }) selectChainModal!: IonModal;

  constructor(
    private balancesService: BalancesService,
    private polkadotJsService: PolkadotJsService,
    private polkadotService: PolkadotService,
    private assethubPolkadotService: AssethubPolkadotService,
    private xodePolkadotService: XodePolkadotService,
    private hydrationService: HydrationService,
    private walletsService: WalletsService,
    private multipayxApiService: MultipayxApiService,
    private toastController: ToastController,
    private router: Router,
    private environmentService: EnvironmentService,
    private alertController: AlertController
  ) {
    addIcons({
      clipboardOutline,
      scanOutline,
      chevronDownOutline,
      close
    });
  }

  currentWallet: Wallet = new Wallet();
  currentWalletPublicAddress: string = '';

  selectedChain: Chain = new Chain();

  balancesObservableTimeout: any = null;
  balancesSubscription: Subscription = new Subscription();
  transferSubscription: Subscription = new Subscription();

  recipientAddress: string = "";
  formattedAmountValue: string = "0";

  isProcessing: boolean = false;
  isChromeExtension = false;

  openSelectChainModal() {
    this.selectChainModal.present();
  }

  onSelectedChain(chain: Chain) {
    this.selectedChain = chain;
    this.selectChainModal.dismiss();
  }

  async pasteFromClipboard() {
    const { type, value } = await Clipboard.read();

    if (type === 'text/plain') {
      this.recipientAddress = value;
    }
  }

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

      this.selectedChain = this.currentWallet.chain;
    }
  }

  async fetchData(): Promise<void> {
    clearTimeout(this.balancesObservableTimeout);
    if (!this.balancesSubscription.closed) this.balancesSubscription.unsubscribe();

    await this.getCurrentWallet();
    await this.getPrice();
  }

  async getPrice(): Promise<void> {
    let pricePerCurrency = await this.multipayxApiService.getPricePerCurrency("USD");
    if (pricePerCurrency.data.length > 0) {
      let price = pricePerCurrency.data.filter(item => item.symbol.toLowerCase() === this.balance.token.symbol.toLowerCase())
      if (price) {
        this.balance.price = price[0].price;
      }
    }

    let service: PolkadotApiService | null = null;

    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 0) service = this.polkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 1000) service = this.assethubPolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 3417) service = this.xodePolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 2034) service = this.hydrationService;

    if (!service) return;

    this.balancesObservableTimeout = setTimeout(() => {
      if (this.balancesSubscription.closed) {
        this.balancesSubscription = service.watchBalance(
          this.balance,
          this.currentWalletPublicAddress
        ).subscribe(balance => {
          this.balance = balance;
        });
      }
    }, 5000);
  }

  formatBalanceWithSuffix(amount: number, decimals: number): string {
    return this.balancesService.formatBalanceWithSuffix(amount, decimals);
  }

  onAmountFocus(event: any) {
    let rawValue = this.formattedAmountValue;
    rawValue = rawValue.replace(/,/g, '');
    if (rawValue.endsWith('.00')) {
      rawValue = rawValue.slice(0, -3);
    }
    this.formattedAmountValue = rawValue;
  }

  onAmountInput(event: any) {
    const inputEl = event.target as HTMLInputElement;
    let rawValue = inputEl.value;

    if (rawValue.startsWith('0') && rawValue.length > 1 && !rawValue.startsWith('0.')) {
      rawValue = rawValue.replace(/^0+/, '');
      if (rawValue === '') rawValue = '0';
    }

    this.formattedAmountValue = rawValue;
  }

  onAmountBlur() {
    let rawValue = this.formattedAmountValue;

    if (!rawValue || rawValue === '') {
      this.formattedAmountValue = '0.00';
      return;
    }

    const [integer, decimal] = rawValue.split('.');
    const withCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    this.formattedAmountValue = decimal !== undefined ? `${withCommas}.${decimal}` : `${withCommas}.00`;
  }

  onAmountKeyDown(event: KeyboardEvent) {
    const inputEl = event.target as HTMLInputElement;
    const value = inputEl.value;

    if (
      event.key === 'Backspace' ||
      event.key === 'Tab' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'Delete'
    ) {
      return;
    }

    if (event.key === '.' && !value.includes('.')) return;

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  fillAmount(percentage: number) {
    const totalAmount = this.balance.quantity;
    const fillAmount = (totalAmount * percentage) / 100;

    this.formattedAmountValue = this.formatBalanceWithSuffix(fillAmount, this.balance.token.decimals);
  }

  async scan() {
    if (this.isChromeExtension) {
      const alert = await this.alertController.create({
        header: 'Scanning Not Supported',
        subHeader: 'Chrome Extension Limitation',
        message: 'Scanning QR codes is not supported in the Chrome Extension version of the app. Please use the mobile app to scan QR codes.',
        backdropDismiss: true,
        buttons: ['Ok'],
      });
      await alert.present();
      return;
    }

    const result = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.ALL
    });

    if (!result?.ScanResult) return;

    const scannedAddress = result.ScanResult.trim();

    if (!this.polkadotJsService.isValidAddress(scannedAddress)) {
      const alert = await this.alertController.create({
        header: 'Invalid Address',
        message: 'The scanned QR code does not contain a valid Substrate/Polkadot address.',
        buttons: ['Ok'],
      });
      await alert.present();
      return;
    }

    this.recipientAddress = scannedAddress;
  }

  async send(): Promise<void> {
    if (this.recipientAddress === "" || this.formattedAmountValue === "0" || this.formattedAmountValue === "0.00") {
      const toast = await this.toastController.create({
        message: 'Recipient address is required!',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    this.isProcessing = true;

    let service: PolkadotApiService | null = null;

    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 0) service = this.polkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 1000) service = this.assethubPolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 3417) service = this.xodePolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 2034) service = this.hydrationService;

    if (!service) return;

    const parseAmount = this.balancesService.parseBalance(Number(this.formattedAmountValue), this.balance.token.decimals);
    const transaction = service.transfer(this.balance, this.recipientAddress, parseAmount);

    const encodedCallDataHex = (await transaction.getEncodedData()).asHex();
    this.onClickSend.emit(encodedCallDataHex);

    this.router.navigate(['/web3/sign-transaction'], {
      queryParams: {
        encodedCallDataHex: encodedCallDataHex
      }
    });
  }

  ngOnInit() {
    this.isChromeExtension = this.environmentService.isChromeExtension();
    this.fetchData();
  }
}
