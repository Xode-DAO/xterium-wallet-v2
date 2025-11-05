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
} from 'ionicons/icons';

import { TransactionHistoryService } from 'src/app/api/transaction-history/transaction-history.service';
import { TransactionHistory } from 'src/models/transaction-history.model';
import { Chain } from 'src/models/chain.model';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { Wallet } from 'src/models/wallet.model';
import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { ChainsService } from 'src/app/api/chains/chains.service';

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
  @Input() wallet: Wallet = {} as Wallet;

  transactions: TransactionHistory[] = [];
  blockHash: string = '';
  isLoading: boolean = false;
  selectedDate: string = new Date().toISOString();

  constructor(
    private transactionHistoryService: TransactionHistoryService,
    private walletsService: WalletsService,
    private chainsService: ChainsService,
    private polkadotJsService: PolkadotJsService
  ) {
    addIcons({
      searchOutline,
      arrowUpOutline,
      arrowDownOutline,
      cashOutline,
      cubeOutline,
      swapHorizontalOutline,
      timeOutline,
    });
  }

  walletPublicKey: string = '';
  currentWallet: Wallet = {} as Wallet;
  walletChain: Chain = {} as Chain;

  getWalletChain(): void {
    const chain = this.chainsService.getChainById(this.wallet.chain_id);
    if (chain) {
      this.walletChain = chain;
    }
  }

  async getCurrentWallet(): Promise<void> {
    const currentWallet = await this.walletsService.getCurrentWallet();
    if (currentWallet) {
      this.currentWallet = currentWallet;
    }
  }

  async encodePublicAddressByChainFormat(publicKey: string, chain: Chain): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map((byte) => Number(byte.trim()))
    );

    const ss58Format = typeof chain.address_prefix === 'number' ? chain.address_prefix : 0;
    return await this.polkadotJsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  async loadCurrentWalletTransfers() {
    this.isLoading = true;
    this.transactions = [];

    await this.encodePublicAddressByChainFormat(this.wallet.public_key, this.walletChain).then((encodedAddress) => {
        this.walletPublicKey = encodedAddress;
      });

    try {
      console.log('Fetching transfers for:', this.walletPublicKey, this.walletChain);

      const allTransfers = await this.transactionHistoryService.fetchTransfers(
        this.walletPublicKey,
        // '12ouvKSvKnXAdXFR5oCL1vXimWrkDWG3joMNw3ETupTRs1ab', // test address
        this.walletChain
      );

      this.transactions = allTransfers;
      console.log('Transfers fetched:', this.transactions);
    } catch (err) {
      console.error('Error fetching current wallet transactions:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async onSearchHash() {
    const value = this.blockHash.trim();

    if (value === '') {
      this.loadCurrentWalletTransfers();
      return;
    }

    this.isLoading = true;

    try {
      const allTransfers = await this.transactionHistoryService.fetchTransfers(
        this.walletPublicKey,
        // '12ouvKSvKnXAdXFR5oCL1vXimWrkDWG3joMNw3ETupTRs1ab', // test address
        this.walletChain
      );

      this.transactions = allTransfers.filter((tx) =>
        tx.hash.toLowerCase().includes(this.blockHash.toLowerCase())
      );

      if (this.transactions.length === 0) {
        console.warn('No transactions found for the given hash.', this.walletPublicKey);
      }
    } catch (err) {
      console.error('Error searching transactions:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async loadCurrentWallet() {
    const wallet = await this.walletsService.getCurrentWallet();
    if (wallet) {
      this.wallet = wallet;
      this.walletPublicKey = wallet.public_key;
    }
  }

  async loadWalletChain(): Promise<void> {
    const chain = this.chainsService.getChainById(this.wallet.chain_id);
    if (chain) {
      this.walletChain = chain;
    }
  }

  trackByHash(index: number, transaction: TransactionHistory) {
    return transaction.hash;
  }

  ngOnInit() {
    this.loadCurrentWallet()
    .then(() => this.loadWalletChain())
    .then(() => this.loadCurrentWalletTransfers());
  }
}
