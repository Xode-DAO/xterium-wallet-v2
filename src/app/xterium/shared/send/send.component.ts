import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
  IonInput,
  IonTextarea,
  IonLabel,
  IonAvatar,
  IonToast,
  ToastController,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { clipboardOutline, scanOutline } from 'ionicons/icons';

import { Balance } from 'src/models/balance.model';
import { Wallet } from 'src/models/wallet.model';
import { Network } from 'src/models/network.model';

import { LocalNotificationsService } from 'src/app/api/local-notifications/local-notifications.service';
import { BalancesService } from 'src/app/api/balances/balances.service';
import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { PolkadotApiService } from 'src/app/api/polkadot-api/polkadot-api.service';
import { AssethubPolkadotService } from 'src/app/api/polkadot-api/assethub-polkadot/assethub-polkadot.service';
import { XodePolkadotService } from 'src/app/api/polkadot-api/xode-polkadot/xode-polkadot.service';
import { NetworksService } from 'src/app/api/networks/networks.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { MultipayxApiService } from 'src/app/api/multipayx-api/multipayx-api.service';

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
    IonInput,
    IonTextarea,
    IonLabel,
    IonAvatar,
    IonToast,
  ]
})
export class SendComponent implements OnInit {
  @Input() balance: Balance = {} as Balance;

  @Output() onSendSuccessful = new EventEmitter<string>();

  constructor(
    private localNotificationsService: LocalNotificationsService,
    private balancesService: BalancesService,
    private polkadotJsService: PolkadotJsService,
    private assethubPolkadotService: AssethubPolkadotService,
    private xodePolkadotService: XodePolkadotService,
    private networksService: NetworksService,
    private walletsService: WalletsService,
    private multipayxApiService: MultipayxApiService,
    private toastController: ToastController
  ) {
    addIcons({
      clipboardOutline,
      scanOutline
    });
  }

  currentWallet: Wallet = {} as Wallet;
  currentWalletPublicAddress: string = '';

  balancesObservableTimeout: any = null;
  balancesSubscription: Subscription = new Subscription();
  transferSubscription: Subscription = new Subscription();

  recipientAddress: string = "";
  formattedAmountValue: string = "0";

  isProcessing: boolean = false;

  async pasteFromClipboard() {
    const { type, value } = await Clipboard.read();

    if (type === 'text/plain') {
      this.recipientAddress = value;
    }
  }

  async encodePublicAddressByChainFormat(publicKey: string, network: Network): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = typeof network.address_prefix === 'number' ? network.address_prefix : 0;
    return await this.polkadotJsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  async getCurrentWallet(): Promise<void> {
    const currentWallet = await this.walletsService.getCurrentWallet();
    if (currentWallet) {
      this.currentWallet = currentWallet;

      const network = this.networksService.getNetworkById(this.currentWallet.network_id);
      if (network) {
        this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, network)
      }
    }
  }

  async fetchData(): Promise<void> {
    clearTimeout(this.balancesObservableTimeout);
    if (!this.balancesSubscription.closed) this.balancesSubscription.unsubscribe();

    await this.getCurrentWallet();
    await this.getTokenPrice();
  }

  async getTokenPrice(): Promise<void> {
    let pricePerCurrency = await this.multipayxApiService.getPricePerCurrency("USD");
    if (pricePerCurrency.data.length > 0) {
      let price = pricePerCurrency.data.filter(item => item.symbol.toLowerCase() === this.balance.token.symbol.toLowerCase())
      if (price) {
        this.balance.price = price[0].price;
      }
    }

    let service: PolkadotApiService | null = null;

    if (this.currentWallet.network_id === 1) service = this.assethubPolkadotService;
    if (this.currentWallet.network_id === 2) service = this.xodePolkadotService;

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
    this.formattedAmountValue =
      decimal !== undefined ? `${withCommas}.${decimal}` : `${withCommas}.00`;
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

  async send(): Promise<void> {
    if (this.recipientAddress === "" || this.formattedAmountValue === "0" || this.formattedAmountValue === "0.00") {
      const toast = await this.toastController.create({
        message: 'Wallet name is required!',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    this.isProcessing = true;

    let service: PolkadotApiService | null = null;

    if (this.currentWallet.network_id === 1) service = this.assethubPolkadotService;
    if (this.currentWallet.network_id === 2) service = this.xodePolkadotService;

    if (!service) return;

    const parseAmount = this.balancesService.parseBalance(Number(this.formattedAmountValue), this.balance.token.decimals);

    const transaction = service.transfer(this.balance, this.recipientAddress, parseAmount);
    const wallet = this.currentWallet;

    this.transferSubscription = service.signTransactions(transaction, wallet).subscribe({
      next: async (event) => {
        this.handleTransferTransactionEvent(event);
      },
      error: async (err) => {
        this.isProcessing = false;
      }
    });
  }

  async handleTransferTransactionEvent(event: any) {
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
        body = `Your transfer has been broadcasted to the network.${hashInfo}`;
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

  ngOnInit() {
    this.fetchData();
  }
}
