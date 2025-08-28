import { Component, OnInit, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';

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

  loading: boolean = false;

  tokens: Token[] = [];
  tokenPrices: TokenPrices[] = [];
  balances: Balance[] = [];

  currentWallet: Wallet = {} as Wallet;
  currentWalletPublicAddress: string = '';

  // updateBalancesTimeout: any = null;

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
    let tokens: Token[] = [];

    if (this.currentWallet.network_id === 1) tokens = await this.assethubPolkadotService.getTokens();
    if (this.currentWallet.network_id === 2) tokens = await this.xodePolkadotService.getTokens();

    this.tokens = tokens;
  }

  async getTokenPrices(): Promise<void> {
    let tokenPrices: TokenPrices[] = [];

    let pricePerCurrency = await this.multipayxApiService.getPricePerCurrency("USD");
    if (pricePerCurrency.data.length > 0) {
      await Promise.all(
        pricePerCurrency.data.map(item => {
          const token = this.tokens.find(token => token.symbol.toLowerCase() === item.symbol.toLowerCase());
          if (token) {
            const tokenPrice: TokenPrices = {
              token: token,
              price: item.price
            }

            tokenPrices.push(tokenPrice);
          }
        })
      );
    }

    this.tokenPrices = tokenPrices;
  }

  async getTokenBalances(): Promise<void> {
    await this.getCurrentWallet();

    await this.getTokens();
    await this.getTokenPrices();

    await this.getBalances();
    await this.computeTotalBalance();
    await this.attachTokenImages();
  }

  async getBalances(): Promise<void> {
    let balances: Balance[] = [];

    if (this.currentWallet.network_id === 1) balances = await this.assethubPolkadotService.getBalances(this.tokens, this.tokenPrices, this.currentWalletPublicAddress);
    if (this.currentWallet.network_id === 2) balances = await this.xodePolkadotService.getBalances(this.tokens, this.tokenPrices, this.currentWalletPublicAddress);

    this.balances = balances;
    this.loading = false;
  }

  async computeTotalBalance(): Promise<void> {
    let totalAmount = 0;

    for (const token of this.tokens) {
      const filtered = this.balances.find(
        w => w.token?.id === token.id
      );

      if (filtered) {
        let amount = filtered.amount;
        let formattedAmount = this.formatBalance(amount, token.decimals);
        totalAmount += Number(formattedAmount);

        this.onTotalAmount.emit(totalAmount);
      }
    }

    // if (this.updateBalancesTimeout) clearTimeout(this.updateBalancesTimeout);
    // this.updateBalancesTimeout = setTimeout(() => {
    //   this.getTokenPrices();
    //   this.getBalances();
    //   this.computeTotalBalance();
    // }, 10000);
  }

  async attachTokenImages(): Promise<void> {
    setTimeout(async () => {
      if (this.balances.length > 0) {
        let balanceTokens = this.balances.map(b => b.token);
        await this.tokensService.attachIcons(balanceTokens);
      }
    }, 500);
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
      this.loading = true;

      this.onTotalAmount.emit(0);
      this.balances = [];

      this.getTokenBalances();
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
      this.loading = true;

      this.onTotalAmount.emit(0);
      this.balances = [];

      this.getTokenBalances();
    }
  }
}
