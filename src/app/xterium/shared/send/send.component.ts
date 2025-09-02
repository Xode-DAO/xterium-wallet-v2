import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subscription } from 'rxjs';

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

  constructor(
    private balancesService: BalancesService,
    private polkadotJsService: PolkadotJsService,
    private assethubPolkadotService: AssethubPolkadotService,
    private xodePolkadotService: XodePolkadotService,
    private networksService: NetworksService,
    private walletsService: WalletsService,
    private multipayxApiService: MultipayxApiService,
  ) {
    addIcons({
      clipboardOutline,
      scanOutline
    });
  }

  currentWallet: Wallet = {} as Wallet;
  currentWalletPublicAddress: string = '';

  observableTimeout: any = null;
  balancesSubscription: Subscription = new Subscription();

  recipientAddress: string = "";
  formattedAmountValue: string = "0.00";

  pasteFromClipboard() {
    navigator.clipboard.readText().then(
      async clipText => {
        this.recipientAddress = clipText;
      }
    );
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
    clearTimeout(this.observableTimeout);
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

    this.observableTimeout = setTimeout(() => {
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

  onAmountInput(event: any) {
    const inputEl = event.target as HTMLInputElement;
    let rawValue = inputEl.value.replace(/,/g, '');

    if (rawValue === '') {
      this.formattedAmountValue = '0';
      return;
    }

    if (!/^\d*\.?\d*$/.test(rawValue)) return;

    const selectionStart = inputEl.selectionStart || 0;
    const charsBeforeCaret = rawValue.slice(0, selectionStart).length;

    const [integer, decimal] = rawValue.split('.');

    const withCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    this.formattedAmountValue = decimal !== undefined ? `${withCommas}.${decimal}` : withCommas;

    setTimeout(() => {
      const newRaw = this.formattedAmountValue.replace(/,/g, '');
      let newPos = charsBeforeCaret;

      if (newPos > newRaw.length) newPos = newRaw.length;
      inputEl.setSelectionRange(newPos, newPos);
    });
  }

  onAmountBlur() {
    if (!this.formattedAmountValue || this.formattedAmountValue === '0') {
      this.formattedAmountValue = '0.00';
      return;
    }

    if (!this.formattedAmountValue.includes('.')) {
      this.formattedAmountValue = this.formattedAmountValue + '.00';
    }
  }

  fillAmount(percentage: number) {
    const totalAmount = this.balance.quantity;
    const fillAmount = (totalAmount * percentage) / 100;

    this.formattedAmountValue = this.formatBalanceWithSuffix(fillAmount, this.balance.token.decimals);
  }

  ngOnInit() {
    this.fetchData();
  }
}
