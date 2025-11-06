import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent
} from '@ionic/angular/standalone';

// import { addIcons } from 'ionicons';
// import {
//   construct,
//   swapVertical,
//   chevronDownOutline,
//   close
// } from 'ionicons/icons';

import { Balance } from 'src/models/balance.model';
// import { TokensComponent } from "src/app/xterium/shared/tokens/tokens.component"

@Component({
  selector: 'app-swap',
  templateUrl: './swap.page.html',
  styleUrls: ['./swap.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent
  ]
})
export class SwapPage implements OnInit {
  // @ViewChild('tokenSelectModal', { read: IonModal }) tokenSelectModal!: IonModal;

  fromToken: Balance | null = null;
  fromAmount: string = '';
  fromTokenBalance: string = '0';
  toToken: Balance | null = null;
  toAmount: string = '';
  toTokenBalance: string = '0';
  exchangeRate: string = '';
  priceImpact: string = '';
  minimumReceived: string = '';
  networkFee: string = '0.005';
  isProcessing: boolean = false;
  currentSelection: 'from' | 'to' = 'from';
  refreshCounter: number = 0;

  constructor() {
    // addIcons({
    //   construct,
    //   swapVertical,
    //   chevronDownOutline,
    //   close
    // });
  }

  openTokenSelectModal(selection: 'from' | 'to') {
    this.currentSelection = selection;
    // this.tokenSelectModal.present();
  }

  selectToken(balance: Balance) {
    if (this.currentSelection === 'from') {
      this.fromToken = balance;
      this.fromTokenBalance = this.formatBalanceWithSuffix(balance.quantity, balance.token.decimals);
    } else {
      this.toToken = balance;
      this.toTokenBalance = this.formatBalanceWithSuffix(balance.quantity, balance.token.decimals);
    }
    this.calculateSwapDetails();
    // this.tokenSelectModal.dismiss();
  }

  switchTokens() {
    [this.fromToken, this.toToken] = [this.toToken, this.fromToken];
    [this.fromTokenBalance, this.toTokenBalance] = [this.toTokenBalance, this.fromTokenBalance];

    if (this.fromAmount && this.toAmount) {
      [this.fromAmount, this.toAmount] = [this.toAmount, this.fromAmount];
    }

    this.calculateSwapDetails();
  }

  onFromAmountChange(event: any) {
    this.fromAmount = event.detail.value;
    this.calculateSwapDetails();
  }

  fillAmount(percentage: number) {
    if (this.fromToken) {
      const balance = this.fromToken.quantity;
      const decimals = this.fromToken.token.decimals;
      const formattedBalance = this.convertToFullUnit(balance, decimals);
      const amount = (formattedBalance * percentage) / 100;
      this.fromAmount = amount.toFixed(6);
      this.calculateSwapDetails();
    }
  }

  setMaxAmount() {
    if (this.fromToken) {
      const balance = this.fromToken.quantity;
      const decimals = this.fromToken.token.decimals;
      const formattedBalance = this.convertToFullUnit(balance, decimals);
      this.fromAmount = formattedBalance.toString();
      this.calculateSwapDetails();
    }
  }

  calculateSwapDetails() {
    if (!this.fromAmount || !this.fromToken || !this.toToken) {
      this.toAmount = '';
      this.exchangeRate = '';
      this.priceImpact = '';
      this.minimumReceived = '';
      return;
    }

    const fromAmountNum = parseFloat(this.fromAmount);
    if (isNaN(fromAmountNum) || fromAmountNum <= 0) return;

    const fromPrice = this.fromToken.price || 1;
    const toPrice = this.toToken.price || 1;

    const exchangeRate = fromPrice / toPrice;
    const calculatedAmount = fromAmountNum * exchangeRate;

    this.toAmount = calculatedAmount.toFixed(6);
    this.exchangeRate = exchangeRate.toFixed(4);
  }

  formatBalance(balance: string): string {
    const numBalance = parseFloat(balance);
    if (numBalance === 0) return '0';

    if (numBalance < 0.001) {
      return '< 0.001';
    }

    if (numBalance < 1) {
      return numBalance.toFixed(4);
    }

    return numBalance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    });
  }

  formatBalanceWithSuffix(amount: number, decimals: number): string {
    const fullAmount = this.convertToFullUnit(amount, decimals);
    return this.formatBalance(fullAmount.toString());
  }

  convertToFullUnit(amount: number, decimals: number): number {
    return amount / Math.pow(10, decimals);
  }

  getPriceImpactClass(): string {
    const impact = parseFloat(this.priceImpact);
    if (impact > 3) return 'price-impact-high';
    if (impact > 1) return 'price-impact-medium';
    return 'price-impact-low';
  }

  get isSwapReady(): boolean {
    if (!this.fromToken || !this.toToken || !this.fromAmount) return false;

    const fromAmountNum = parseFloat(this.fromAmount);
    const fromBalanceNum = parseFloat(this.fromTokenBalance);

    return fromAmountNum > 0 && fromAmountNum <= fromBalanceNum;
  }

  getSwapButtonText(): string {
    if (!this.fromToken || !this.toToken) return 'Select Tokens';
    if (!this.fromAmount || parseFloat(this.fromAmount) <= 0) return 'Enter Amount';

    const fromAmountNum = parseFloat(this.fromAmount);
    const fromBalanceNum = parseFloat(this.fromTokenBalance);

    if (fromAmountNum > fromBalanceNum) return 'Insufficient Balance';
    return `Swap ${this.fromToken.token.symbol} for ${this.toToken.token.symbol}`;
  }

  async executeSwap() {
    if (!this.isSwapReady) return;

    this.isProcessing = true;

    try {

    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  ngOnInit() { }

}
