import { Component, OnInit, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonSpinner,
} from '@ionic/angular/standalone';

import { Token, TokenPrices } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { Wallet } from 'src/models/wallet.model';
import { Network } from 'src/models/network.model';

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';

import { PolkadotApiService } from 'src/app/api/polkadot-api/polkadot-api.service';
import { AssethubPolkadotService } from 'src/app/api/polkadot-api/assethub-polkadot/assethub-polkadot.service';
import { XodePolkadotService } from 'src/app/api/polkadot-api/xode-polkadot/xode-polkadot.service';

import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { NetworksService } from 'src/app/api/networks/networks.service';
import { TokensService } from 'src/app/api/tokens/tokens.service';
import { BalancesService } from 'src/app/api/balances/balances.service';
import { MultipayxApiService } from 'src/app/api/multipayx-api/multipayx-api.service';

@Component({
  selector: 'app-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss'],
  imports: [
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonSpinner,
  ],
  providers: [
    { provide: PolkadotApiService, useClass: AssethubPolkadotService },
    { provide: PolkadotApiService, useClass: XodePolkadotService },
  ]
})
export class TokensComponent implements OnInit {
  @Input() refreshCounter: number = 0;

  @Output() onTotalAmount = new EventEmitter<number>();
  @Output() onOpenToken = new EventEmitter<Balance>();

  constructor(
    private polkadotJsService: PolkadotJsService,
    private assethubPolkadotService: AssethubPolkadotService,
    private xodePolkadotService: XodePolkadotService,
    private networksService: NetworksService,
    private walletsService: WalletsService,
    private tokensService: TokensService,
    private balancesService: BalancesService,
    private multipayxApiService: MultipayxApiService,
  ) { }

  tokens: Token[] = [];
  tokenPrices: TokenPrices[] = [];
  balances: Balance[] = [];

  currentWallet: Wallet = {} as Wallet;
  currentWalletPublicAddress: string = '';

  observableTimeout: any = null;
  tokensSubscription: Subscription = new Subscription();
  balancesSubscription: Subscription = new Subscription();

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

  async getTokens(): Promise<void> {
    let service: PolkadotApiService | null = null;

    if (this.currentWallet.network_id === 1) service = this.assethubPolkadotService;
    if (this.currentWallet.network_id === 2) service = this.xodePolkadotService;

    if (!service) return;

    this.tokens = await service.getTokens();
    await this.getTokenPrices();
  }

  async getTokenPrices(): Promise<void> {
    let tokenPrices: TokenPrices[] = [];

    let pricePerCurrency = await this.multipayxApiService.getPricePerCurrency("USD");
    if (pricePerCurrency.data.length > 0) {
      await Promise.all(
        pricePerCurrency.data.map(item => {
          const token = this.tokens.find(token => token.symbol.toLowerCase() === item.symbol.toLowerCase());
          if (token) {
            tokenPrices.push({
              token: token,
              price: item.price
            });
          }
        })
      );
    }

    this.tokenPrices = tokenPrices;
  }

  async getBalances(): Promise<void> {
    let service: PolkadotApiService | null = null;

    if (this.currentWallet.network_id === 1) service = this.assethubPolkadotService;
    if (this.currentWallet.network_id === 2) service = this.xodePolkadotService;

    if (!service) return;

    this.balances = await service.getBalances(this.tokens, this.tokenPrices, this.currentWalletPublicAddress);
    this.computeTotalBalanceAmount();

    await this.getBalanceTokenImages();

    this.observableTimeout = setTimeout(() => {
      if (this.balancesSubscription.closed) {
        this.balancesSubscription = service.watchBalances(
          this.tokens,
          this.tokenPrices,
          this.currentWalletPublicAddress
        ).subscribe(balances => {
          this.balances = balances;
          this.computeTotalBalanceAmount();
        });
      }
    }, 5000);
  }

  computeTotalBalanceAmount(): void {
    setTimeout(() => {
      let totalAmount = 0;

      for (const token of this.tokens) {
        const filtered = this.balances.find(
          w => w.token?.reference_id === token.reference_id
        );

        if (filtered) {
          let amount = filtered.amount;
          let formattedAmount = this.formatBalance(amount, token.decimals);
          totalAmount += Number(formattedAmount);

          this.onTotalAmount.emit(totalAmount);
        }
      }
    }, 1500);
  }

  async getBalanceTokenImages(): Promise<void> {
    setTimeout(async () => {
      if (this.balances.length > 0) {
        let balanceTokens = this.balances.map(b => b.token);
        await this.tokensService.attachIcons(balanceTokens);
      }
    }, 500);
  }

  async fetchData(): Promise<void> {
    clearTimeout(this.observableTimeout);
    if (!this.tokensSubscription.closed) this.tokensSubscription.unsubscribe();
    if (!this.balancesSubscription.closed) this.balancesSubscription.unsubscribe();

    await this.getCurrentWallet();

    this.balances = [];
    this.onTotalAmount.emit(0);

    await this.getTokens();
    await this.getBalances();
  }

  formatBalance(amount: number, decimals: number): number {
    return this.balancesService.formatBalance(amount, decimals);
  }

  formatBalanceWithSuffix(amount: number, decimals: number): string {
    return this.balancesService.formatBalanceWithSuffix(amount, decimals);
  }

  openToken(balance: Balance): void {
    this.onOpenToken.emit(balance);
  }

  ngOnInit() {
    this.walletsService.currentWalletObservable.subscribe(wallet => {
      this.fetchData();
    });

    this.tokensService.tokenImagesObservable.subscribe(tokenImages => {
      if (tokenImages.length > 0) {
        for (let i = 0; i < tokenImages.length; i++) {
          let balanceToken = this.balances.filter(d => d.token.id === tokenImages[i].id)[0];
          if (balanceToken) {
            balanceToken.token.image = tokenImages[i].image;
          }
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    const refreshCounter = changes['refreshCounter']?.currentValue;
    if (refreshCounter > 0) {
      this.fetchData();
    }
  }
}
