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
  IonItem,
  IonDatetime,
  IonDatetimeButton,
  IonCard,
  IonAvatar,
  IonModal,
  IonIcon,
  IonChip,
  IonInput,
  IonButton,
  IonSpinner,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  searchOutline,
  arrowUpOutline,
  arrowDownOutline,
  cashOutline,
  cubeOutline,
  swapHorizontalOutline,
  timeOutline,
  constructOutline
} from 'ionicons/icons';

import { Wallet } from 'src/models/wallet.model';
import { Chain } from 'src/models/chain.model';
import { Transfers, Extrinsics } from 'src/models/transaction-history.model';

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { TransactionHistoryService } from 'src/app/api/transaction-history/transaction-history.service';
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
    IonItem,
    IonDatetime,
    IonDatetimeButton,
    IonCard,
    IonAvatar,
    IonModal,
    IonIcon,
    IonChip,
    IonInput,
    IonButton,
    IonSpinner,
  ],
})
export class TransactionHistoryPage implements OnInit {

  constructor(
    private polkadotJsService: PolkadotJsService,
    private walletsService: WalletsService,
    private chainsService: ChainsService,
    private transactionHistoryService: TransactionHistoryService,
    private balancesService: BalancesService
  ) {
    addIcons({
      searchOutline,
      arrowUpOutline,
      arrowDownOutline,
      cashOutline,
      cubeOutline,
      swapHorizontalOutline,
      timeOutline,
      constructOutline
    });
  }

  currentWallet: Wallet = {} as Wallet;
  currentWalletPublicAddress: string = '';

  selectedDate: string = new Date().toISOString();

  searchKeyword: string = '';

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

  async fetchTransfers(): Promise<void> {
    this.isTransfersLoading = true;

    this.transfers = [];
    this.transfers = await this.transactionHistoryService.fetchTransfers(
      this.currentWalletPublicAddress,
      this.currentWallet.chain,
    );

    this.isTransfersLoading = false;
  }

  async fetchExtrinsics(): Promise<void> {
    this.isExtrinsicsLoading = true;

    this.extrinsics = [];
    this.extrinsics = await this.transactionHistoryService.fetchExtrinsics(
      this.currentWalletPublicAddress,
      this.currentWallet.chain,
    );

    this.isExtrinsicsLoading = false;
  }

  async fetchData(): Promise<void> {
    await this.getCurrentWallet();

    await this.fetchTransfers();
    await this.fetchExtrinsics();
  }

  ngOnInit() {
    this.fetchData();
  }
}
