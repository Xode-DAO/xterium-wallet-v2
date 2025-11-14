import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonInput,
  IonAvatar,
  IonCard,
  IonLabel,
  IonText,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';

import { Chain } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model';
import { USDTTokenDetails, PayDetails } from 'src/models/pay.model';

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

@Component({
  selector: 'app-payment-details',
  templateUrl: './payment-details.page.html',
  styleUrls: ['./payment-details.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonInput,
    IonAvatar,
    IonCard,
    IonLabel,
    IonText,
  ]
})
export class PaymentDetailsPage implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private utilsService: UtilsService,
    private walletsService: WalletsService
  ) {
    addIcons({
      arrowBackOutline,
      close,
    });
  }

  currentWallet: Wallet = new Wallet();
  currentWalletPublicAddress: string = '';

  formattedAmountValue: string = "0";

  dummyUsdtTokenBalance: USDTTokenDetails = {
    token_symbol: 'USDt',
    amount: 9.969981,
    price: 1.003011,
  };
  payDetails: PayDetails = new PayDetails();

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

  getUSDTTokenDetails() {

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

  send() {
    this.router.navigate(['/xterium/payment-summary'], {
      queryParams: {
        payDetails: JSON.stringify(this.payDetails),
        formattedAmount: this.formattedAmountValue,
        wallet: JSON.stringify(this.currentWallet),
        walletAddress: this.currentWalletPublicAddress
      }
    });
  }

  ngOnInit() {
    this.getCurrentWallet();
    this.route.queryParams.subscribe(params => {
      if (params['payDetails']) {
        this.payDetails = JSON.parse(params['payDetails']);

        const rawValue = this.payDetails.amount.toString();
        if (!rawValue || rawValue === '') {
          this.formattedAmountValue = '0.00';
          return;
        }
        const [integer, decimal] = rawValue.split('.');
        const withCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        this.formattedAmountValue = decimal !== undefined ? `${withCommas}.${decimal}` : `${withCommas}.00`;
      }
    });
  }
}
