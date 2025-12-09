import { Component, OnInit, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';

import { ApiPromise } from '@polkadot/api';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonAvatar,
  IonSpinner,
} from '@ionic/angular/standalone';

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { Price } from 'src/models/price.model';
import { Wallet } from 'src/models/wallet.model';
import { Network } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { PolkadotJsService } from 'src/app/api/polkadot/blockchains/polkadot-js/polkadot-js.service';
import { PolkadotService } from 'src/app/api/polkadot/blockchains/polkadot-js/polkadot/polkadot.service';
import { AssethubPolkadotService } from 'src/app/api/polkadot/blockchains/polkadot-js/assethub-polkadot/assethub-polkadot.service';
import { XodePolkadotService } from 'src/app/api/polkadot/blockchains/polkadot-js/xode-polkadot/xode-polkadot.service';
import { HydrationPolkadotService } from 'src/app/api/polkadot/blockchains/polkadot-js/hydration-polkadot/hydration-polkadot.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { TokensService } from 'src/app/api/tokens/tokens.service';
import { BalancesService } from 'src/app/api/balances/balances.service';
import { MultipayxApiService } from 'src/app/api/multipayx-api/multipayx-api.service';
import { SettingsService } from 'src/app/api/settings/settings.service';

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
    private utilsService: UtilsService,
    private polkadotService: PolkadotService,
    private assethubPolkadotService: AssethubPolkadotService,
    private xodePolkadotService: XodePolkadotService,
    private hydrationPolkadotService: HydrationPolkadotService,
    private walletsService: WalletsService,
    private tokensService: TokensService,
    private balancesService: BalancesService,
    private multipayxApiService: MultipayxApiService,
    private settingsService: SettingsService,
  ) { }

  pjsApi!: ApiPromise;

  tokens: Token[] = [];
  balances: Balance[] = [];
  prices: Price[] = [];

  currentWallet: Wallet = new Wallet();
  currentWalletPublicAddress: string = '';

  observableTimeout: any = null;
  balancesSubscription: Subscription = new Subscription();

  symbols: string = '';

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

  async getTokens(): Promise<void> {
    let service: PolkadotJsService | null = null;

    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 0) service = this.polkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 1000) service = this.assethubPolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 3417) service = this.xodePolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 2034) service = this.hydrationPolkadotService;

    if (!service) return;

    this.pjsApi = await service.connect();
    this.tokens = await service.getTokens(this.pjsApi);

    setTimeout(async () => {
      await this.getAndWatchBalances(service);
    }, 500);
  }

  async getAndWatchBalances(service: PolkadotJsService): Promise<void> {
    this.balances = await service.getBalances(this.pjsApi, this.tokens, this.currentWalletPublicAddress);
    await this.getBalanceTokenImages();

    this.observableTimeout = setTimeout(() => {
      if (this.balancesSubscription.closed) {
        this.balancesSubscription = service.watchBalances(this.pjsApi, this.tokens, this.currentWalletPublicAddress).subscribe(async balances => {
          this.balances = balances;
          this.computeBalancesAmount();
        });
      }
    }, 5000);

    await this.getPrices();
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

  async getPrices(): Promise<void> {
    const currencies = await this.settingsService.get();
    const currencyCode = currencies?.user_preferences?.currency_code || "";
    const currencySymbol = currencies?.user_preferences?.currency_symbol || "";

    let prices: Price[] = [];

    let pricePerCurrency = await this.multipayxApiService.getPricePerCurrency(currencyCode);
    if (pricePerCurrency.data.length > 0) {
      pricePerCurrency.data.map(item => {
        const token = this.tokens.find(token => token.symbol.toLowerCase() === item.symbol.toLowerCase());
        if (token) {
          prices.push({
            id: item.id,
            token: token,
            price: item.price
          });
        }
      })
    }

    this.symbols = currencySymbol
    this.prices = prices;
    this.computeBalancesAmount();
  }

  computeBalancesAmount(): void {
    this.balances = this.balances.map(asset => {
      const priceObj = this.prices.find(p => p.token.symbol.toLowerCase() === asset.token.symbol.toLowerCase());
      const price = priceObj ? priceObj.price : 0;
      const amount = asset.quantity * price;

      return {
        ...asset,
        price,
        amount
      };
    });

    this.computeTotalBalanceAmount();
  }

  computeTotalBalanceAmount(): void {
    setTimeout(() => {
      let totalAmount = 0;

      for (const balance of this.balances) {
        let amount = balance.amount;
        let formattedAmount = this.formatBalance(amount, balance.token.decimals);
        totalAmount += Number(formattedAmount);

        this.onTotalAmount.emit(totalAmount);
      }
    }, 1500);
  }

  async fetchData(): Promise<void> {
    clearTimeout(this.observableTimeout);
    if (!this.balancesSubscription.closed) this.balancesSubscription.unsubscribe();

    await this.getCurrentWallet();

    this.tokens = [];
    this.balances = [];

    this.onTotalAmount.emit(0);

    await this.getTokens();
  }

  formatBalance(amount: number, decimals: number): number {
    return this.balancesService.formatBalance(amount, decimals);
  }

  formatBalanceWithSuffix(amount: number, decimals: number): string {
    return this.balancesService.formatBalanceWithSuffix(amount, decimals);
  }

  formatPrice(value: number): string {
    if (Number.isInteger(value)) {
      return value.toString();
    }
  
    const decimals = value.toFixed(7);
    const [intPart, decPart] = decimals.split(".");

    const zeroCount = (decPart.match(/^0+/) || [""])[0].length;

    if (zeroCount >= 4) {
      const rest = decPart.slice(zeroCount);
      return `${intPart}.0{${zeroCount}}${rest}`;
    }

    return parseFloat(value.toFixed(4)).toString();
  }

  openToken(balance: Balance): void {
    this.onOpenToken.emit(balance);
  }

  ngOnInit() {
    this.walletsService.currentWalletObservable.subscribe(wallet => {
      this.fetchData();
    });

    this.settingsService.currentSettingsObservable.subscribe(settings => {
      if (settings) {
        this.fetchData();
      }
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
