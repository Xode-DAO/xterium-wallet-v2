import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subscription } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexTitleSubtitle,
  ApexXAxis
} from "ng-apexcharts";

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonAvatar,
  IonLabel,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, qrCode, send, swapHorizontal } from 'ionicons/icons';

import { Chain, Network } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model';
import { Balance } from 'src/models/balance.model';

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { PolkadotApiService } from 'src/app/api/polkadot-api/polkadot-api.service';
import { PolkadotService } from 'src/app/api/polkadot-api/polkadot/polkadot.service';
import { AssethubPolkadotService } from 'src/app/api/polkadot-api/assethub-polkadot/assethub-polkadot.service';
import { XodePolkadotService } from 'src/app/api/polkadot-api/xode-polkadot/xode-polkadot.service';
import { HydrationService } from 'src/app/api/polkadot-api/hydration/hydration.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { BalancesService } from 'src/app/api/balances/balances.service';
import { MultipayxApiService } from 'src/app/api/multipayx-api/multipayx-api.service';

import { ReceiveComponent } from "src/app/xterium/shared/receive/receive.component";
import { SendComponent } from "src/app/xterium/shared/send/send.component"

@Component({
  selector: 'app-token-details',
  templateUrl: './token-details.page.html',
  styleUrls: ['./token-details.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonButtons,
    IonIcon,
    IonItem,
    IonAvatar,
    IonLabel,
    IonModal,
    IonTitle,
    IonToolbar,
    ReceiveComponent,
    SendComponent,
    NgApexchartsModule
  ]
})
export class TokenDetailsPage implements OnInit {
  @ViewChild('tokenDetailsSend', { read: IonModal }) tokenDetailsSendModal!: IonModal;

  @Output() onClickSendSuccessful = new EventEmitter<string>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private polkadotJsService: PolkadotJsService,
    private polkadotService: PolkadotService,
    private assethubPolkadotService: AssethubPolkadotService,
    private xodePolkadotService: XodePolkadotService,
    private hydrationService: HydrationService,
    private chainsService: ChainsService,
    private walletsService: WalletsService,
    private balancesService: BalancesService,
    private multipayxApiService: MultipayxApiService,
  ) {
    addIcons({
      arrowBackOutline,
      qrCode,
      send,
      swapHorizontal,
    });
  }

  balance: Balance = {} as Balance;

  currentWallet: Wallet = {} as Wallet;
  currentWalletPublicAddress: string = '';

  observableTimeout: any = null;
  balancesSubscription: Subscription = new Subscription();

  candlestickSeries: ApexAxisChartSeries = [];

  candlestickChart: ApexChart = {
    type: "candlestick",
    height: 350,
  };

  candlestickTitle: ApexTitleSubtitle = {
    text: "Price History",
    align: "left",
    style: {
      color: "#ffffff",
    }
  };

  candlestickXaxis: ApexXAxis = {
    type: "datetime",
    labels: {
      style: {
        colors: "#ffffff",
        cssClass: 'label-bg'
      }
    }
  };

  candlestickYaxis = {
    labels: {
      style: {
        colors: "#ffffff"
      }
    }
  };

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

  goToSwap() {
    this.router.navigate(['/xterium/swap']);
  }

  getChainName(chainId: number): string {
    const chain = this.chainsService.getChainById(chainId);
    if (!chain) {
      return "";
    }

    return chain.name;
  }

  async fetchData(): Promise<void> {
    clearTimeout(this.observableTimeout);
    if (!this.balancesSubscription.closed) this.balancesSubscription.unsubscribe();

    await this.getCurrentWallet();
    await this.getTokenPrice();
  }

  async getTokenPrice(): Promise<void> {
    let pricePerCurrency = await this.multipayxApiService.getPricePerCurrency("USD");
    if (pricePerCurrency.data.length > 0) {
      let price = pricePerCurrency.data.filter(item => item.symbol.toLowerCase() === this.balance.token.symbol.toLowerCase())
      if (price) {
        this.balance.price = price[0].price;
      }
    }

    let service: PolkadotApiService | null = null;

    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 0) service = this.polkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 1000) service = this.assethubPolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 3417) service = this.xodePolkadotService;
    if (this.currentWallet.chain.network === Network.Polkadot && this.currentWallet.chain.chain_id === 2034) service = this.hydrationService;

    if (!service) return;

    this.observableTimeout = setTimeout(() => {
      if (this.balancesSubscription.closed) {
        this.balancesSubscription = service.watchBalance(
          this.balance,
          this.currentWalletPublicAddress
        ).subscribe(balance => {
          this.balance = balance;
        });
      }
    }, 5000);
  }

  formatBalanceWithSuffix(amount: number, decimals: number): string {
    return this.balancesService.formatBalanceWithSuffix(amount, decimals);
  }

  // Price history is currently not available
  //
  // generateDummyPriceHistory(symbol: string) {
  //   return [
  //     { x: new Date('2025-01-01'), y: [7.1, 7.4, 7.0, 7.3] },
  //     { x: new Date('2025-01-02'), y: [7.3, 7.6, 7.2, 7.4] },
  //     { x: new Date('2025-01-03'), y: [7.4, 7.8, 7.3, 7.7] },
  //     { x: new Date('2025-01-04'), y: [7.7, 7.9, 7.5, 7.6] },
  //     { x: new Date('2025-01-05'), y: [7.6, 7.8, 7.4, 7.5] }
  //   ];
  // }
  //
  // initCandlestickChart() {
  //   if (!this.balance?.token?.symbol) return;
  //
  //   const history = this.generateDummyPriceHistory(this.balance.token.symbol);
  //
  //   this.candlestickSeries = [
  //     {
  //       name: `${this.balance.token.symbol} Price`,
  //       data: history
  //     }
  //   ];
  // }

  onClickSend(_: string) {
    this.tokenDetailsSendModal.dismiss();
    this.onClickSendSuccessful.emit(_);
  }

  ngOnInit() {
    this.walletsService.currentWalletObservable.subscribe(wallet => {
      this.fetchData();
    });

    this.route.queryParams.subscribe(params => {
      if (params['balance']) {
        this.balance = JSON.parse(params['balance']);
      }
    });
  }
}
