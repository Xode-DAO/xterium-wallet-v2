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
  IonButton
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
import { Network } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';
import { Payments, Transfers, Extrinsics } from 'src/models/transaction-history.model';

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
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
    IonButton,
  ],
})
export class TransactionHistoryPage implements OnInit {

  constructor(
    private utilsService: UtilsService,
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

  currentSegment: string = 'payments';

  payments: { date: string; list: Payments[] }[] = [];
  isPaymentsLoading: boolean = true;

  transfers: Transfers[] = [];
  isTransfersLoading: boolean = true;
  isLoadingMoreTransfers: boolean = false;
  transfersPage: number = 1;
  transfersRow: number = 10;

  extrinsics: Extrinsics[] = [];
  isExtrinsicsLoading: boolean = true;
  isLoadingMoreExtrinsics: boolean = false;
  extrinsicsPage: number = 1;
  extrinsicsRow: number = 10;

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
      this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, this.currentWallet.chain);
    }
  }

  formatBalance(amount: number, decimals: number): number {
    return this.balancesService.formatBalance(amount, decimals);
  }

  async fetchPayments(): Promise<void> {
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

    const names = name.trim().split(/\s+/);
    const upperCaseName = names.map(name => name.toUpperCase());
    
    const maskedParts = upperCaseName.map((namePart, index) => {
      if (index === upperCaseName.length - 1) {
        return `${namePart[0]}.`;
      } else {
        if (namePart.length <= 3) {
          return `${namePart[0]}${'*'.repeat(namePart.length - 1)}`;
        } else {
          return `${namePart.slice(0, 2)}${'*'.repeat(namePart.length - 3)}${namePart.slice(-1)}`;
        }
      }
    });
    
    return maskedParts.join(' ');
  }

  formatAccountNumber(accountNumber: string): string {
    if (!accountNumber) return '';

    const cleanAccount = accountNumber.replace(/\s+/g, '');

    if (cleanAccount.startsWith('09') && cleanAccount.length === 11) {
      return `${cleanAccount.slice(0, 4)}***${cleanAccount.slice(7)}`;
    }
    if ((cleanAccount.startsWith('+639') || cleanAccount.startsWith('639')) && cleanAccount.length >= 10) {
      const normalized = '09' + cleanAccount.slice(cleanAccount.startsWith('+639') ? 4 : 3);
      if (normalized.length === 11) {
        return `${normalized.slice(0, 4)}***${normalized.slice(7)}`;
      }
    }

    const length = cleanAccount.length;
    
    if (length <= 8) {
      return `${cleanAccount.slice(0, 4)}***${cleanAccount.slice(-2)}`;
    } else if (length <= 12) {
      return `${cleanAccount.slice(0, 5)}***${cleanAccount.slice(-3)}`;
    } else {
      return `${cleanAccount.slice(0, 6)}***${cleanAccount.slice(-4)}`;
    }
  }

  async fetchTransfers(): Promise<void> {
    const newTransfers = await this.scannerService.fetchTransfers(
      this.currentWalletPublicAddress,
      this.currentWallet.chain,
      this.transfersPage,
      this.transfersRow
    );

    if (newTransfers && newTransfers.length > 0) {
      this.transfers.push(...newTransfers);
      this.transfersPage++;
    }

    this.isTransfersLoading = false;
  }

  async fetchExtrinsics(): Promise<void> {
    const newExtrinsics = await this.scannerService.fetchExtrinsics(
      this.currentWalletPublicAddress,
      this.currentWallet.chain,
      this.extrinsicsPage,
      this.extrinsicsRow
    );

    if (newExtrinsics && newExtrinsics.length > 0) {
      this.extrinsics.push(...newExtrinsics);
      this.extrinsicsPage++;
    }

    this.isExtrinsicsLoading = false;
  }

  async fetchData(): Promise<void> {
    await this.getCurrentWallet();

    await this.fetchPayments();
    await this.fetchTransfers();
    await this.fetchExtrinsics();
  }

  async loadMoreData(): Promise<void> {
    if (this.currentSegment === 'transfers') {
      this.isLoadingMoreTransfers = true;

      await this.fetchTransfers();
      this.isLoadingMoreTransfers = false;
    }

    if (this.currentSegment === 'transactions') {
      this.isLoadingMoreExtrinsics = true;

      await this.fetchExtrinsics();
      this.isLoadingMoreExtrinsics = false;
    }
  }

  async segmentChanged(event: any) {
    const segment = event.detail.value;
    this.currentSegment = segment;
  }

  ngOnInit() {
    this.walletsService.currentWalletObservable.subscribe(wallet => {
      this.isPaymentsLoading = true;
      this.payments = [];

      this.isTransfersLoading = true;
      this.transfers = [];
      this.transfersPage = 1;
      this.transfersRow = 10;

      this.isExtrinsicsLoading = true;
      this.extrinsics = [];
      this.extrinsicsPage = 1;
      this.extrinsicsRow = 10;

      this.fetchData();
    });
  }
}
