import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonSegmentView,
  IonSegmentContent,
  IonLabel,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonCard,
  IonAvatar,
  IonIcon,
  IonChip,
  IonSpinner,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  searchOutline,
  person,
  informationCircle,
  arrowUpOutline,
  arrowDownOutline,
  cashOutline,
  cubeOutline,
  swapHorizontalOutline,
  timeOutline,
  constructOutline
} from 'ionicons/icons';

import { Wallet } from 'src/models/wallet.model';
import { Chain, Network } from 'src/models/chain.model';
import { Payments, Transfers, Extrinsics } from 'src/models/transaction-history.model';

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { MultipayxApiService } from 'src/app/api/multipayx-api/multipayx-api.service';
import { ScannerService } from 'src/app/api/scanner/scanner.service';
import { BalancesService } from 'src/app/api/balances/balances.service';

@Component({
  selector: 'app-transaction-history',
  templateUrl: './transaction-history.page.html',
  styleUrls: ['./transaction-history.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonSegmentView,
    IonSegmentContent,
    IonLabel,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonCard,
    IonAvatar,
    IonIcon,
    IonChip,
    IonSpinner,
  ],
})
export class TransactionHistoryPage implements OnInit {

  constructor(
    private polkadotJsService: PolkadotJsService,
    private walletsService: WalletsService,
    private chainsService: ChainsService,
    private multipayxApiService: MultipayxApiService,
    private scannerService: ScannerService,
    private balancesService: BalancesService
  ) {
    addIcons({
      searchOutline,
      person,
      informationCircle,
      arrowUpOutline,
      arrowDownOutline,
      cashOutline,
      cubeOutline,
      swapHorizontalOutline,
      timeOutline,
      constructOutline
    });
  }

  currentWallet: Wallet = new Wallet();
  currentWalletPublicAddress: string = '';

  selectedDate: string = new Date().toISOString();

  searchKeyword: string = '';

  payments: { date: string; list: Payments[] }[] = [];
  isPaymentsLoading: boolean = false;

  transfers: Transfers[] = [];
  isTransfersLoading: boolean = false;

  extrinsics: Extrinsics[] = [];
  isExtrinsicsLoading: boolean = false;

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
      this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, this.currentWallet.chain);
    }
  }

  formatBalance(amount: number, decimals: number): number {
    return this.balancesService.formatBalance(amount, decimals);
  }

  async fetchPayments(): Promise<void> {
    this.isPaymentsLoading = true;

    this.payments = [];

    const substrateChain = this.chainsService.getChainsByNetwork(Network.Substrate)[0];
    const address = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, substrateChain);

    const paymentsData = await this.multipayxApiService.fetchPayments(address);
    this.payments = this.groupPaymentsByDate(paymentsData);

    this.isPaymentsLoading = false;
  }

  private groupPaymentsByDate(payments: Payments[]): { date: string; list: Payments[] }[] {
    const grouped: { [key: string]: Payments[] } = {};

    for (const payment of payments) {
      const date = new Date(payment.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(payment);
    }

    return Object.entries(grouped).map(([date, list]) => ({ date, list }));
  }

  maskName(name: string): string {
    if (!name) return '';

    const cleanName = name.replace(/\s+/g, '').toUpperCase();

    if (cleanName.length <= 4) {
      return cleanName[0] + '*'.repeat(cleanName.length - 2) + cleanName.slice(-1);
    }

    const first = cleanName.slice(0, 2);
    const last = cleanName.slice(-2);
    const masked = '*'.repeat(cleanName.length - 4);

    return `${first}${masked}${last}`;
  }

  async fetchTransfers(): Promise<void> {
    this.isTransfersLoading = true;

    this.transfers = [];
    this.transfers = await this.scannerService.fetchTransfers(
      this.currentWalletPublicAddress,
      this.currentWallet.chain,
    );

    this.isTransfersLoading = false;
  }

  async fetchExtrinsics(): Promise<void> {
    this.isExtrinsicsLoading = true;

    this.extrinsics = [];
    this.extrinsics = await this.scannerService.fetchExtrinsics(
      this.currentWalletPublicAddress,
      this.currentWallet.chain,
    );

    this.isExtrinsicsLoading = false;
  }

  async fetchData(): Promise<void> {
    await this.getCurrentWallet();

    await this.fetchPayments();
    await this.fetchTransfers();
    await this.fetchExtrinsics();
  }

  async segmentChanged(event: any) {
    const segment = event.detail.value;

    if (segment === 'payments') {
      await this.fetchPayments();
    } else if (segment === 'transfers') {
      await this.fetchTransfers();
    } else if (segment === 'extrinsics') {
      await this.fetchExtrinsics();
    } else {
      await this.fetchData();
    }
  }

  ngOnInit() {
    this.walletsService.currentWalletObservable.subscribe(wallet => {
      this.fetchData();
    });
  }
}
