import { Component, OnInit, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonAvatar,
  IonSpinner,
} from '@ionic/angular/standalone';

import { Token, TokenPrice } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { Wallet } from 'src/models/wallet.model';
import { Chain, Network } from 'src/models/chain.model';

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { PolkadotApiService } from 'src/app/api/polkadot-api/polkadot-api.service';
import { AssethubPolkadotService } from 'src/app/api/polkadot-api/assethub-polkadot/assethub-polkadot.service';
import { XodePolkadotService } from 'src/app/api/polkadot-api/xode-polkadot/xode-polkadot.service';

import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
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
    private chainsService: ChainsService,
    private walletsService: WalletsService,
    private tokensService: TokensService,
    private balancesService: BalancesService,
    private multipayxApiService: MultipayxApiService,
  ) { }

  tokens: Token[] = [];
  tokenPrices: TokenPrice[] = [];
  balances: Balance[] = [];

  currentWallet: Wallet = {} as Wallet;
  currentWalletPublicAddress: string = '';

  observableTimeout: any = null;
  balancesSubscription: Subscription = new Subscription();

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
      this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, this.currentWallet.chain)
    }
  }

  async getTokens(): Promise<void> {
    let service: PolkadotApiService | null = null;

    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 1000) service = this.assethubPolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 3417) service = this.xodePolkadotService;

    if (!service) return;

    this.tokens = await service.getTokens();
    await this.getTokenPrices();
  }

  async getTokenPrices(): Promise<void> {
    let tokenPrices: TokenPrice[] = [];

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

    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 1000) service = this.assethubPolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 3417) service = this.xodePolkadotService;

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
        if (balanceTokens.length > 0) {
          for (const token of balanceTokens) {
            await this.tokensService.attachIcon(token);
          }
        }
      }
    }, 500);
  }

  async fetchData(): Promise<void> {
    clearTimeout(this.observableTimeout);
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

    this.tokensService.tokenImageObservable.subscribe(tokenImage => {
      if (tokenImage) {
        let balanceToken = this.balances.filter(d => d.token.id === tokenImage.id)[0];
        if (balanceToken) {
          balanceToken.token.image = tokenImage.image;
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
