import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonButtons,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
  IonToggle,
  IonChip
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { qrCode, send, swapHorizontal, card, close } from 'ionicons/icons';

import { Balance } from 'src/models/balance.model';

import { TokensComponent } from "src/app/xterium/shared/tokens/tokens.component"
import { ReceiveComponent } from "src/app/xterium/shared/receive/receive.component";
import { SendComponent } from "src/app/xterium/shared/send/send.component"

import { SettingsService } from 'src/app/api/settings/settings.service';
import { BalancesService } from 'src/app/api/balances/balances.service';

import { TranslatePipe } from '@ngx-translate/core';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { Wallet } from 'src/models/wallet.model';

@Component({
  selector: 'app-balances',
  templateUrl: './balances.page.html',
  styleUrls: ['./balances.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonButtons,
    IonIcon,
    IonModal,
    IonTitle,
    IonToolbar,
    IonChip,
    TokensComponent,
    ReceiveComponent,
    SendComponent,
    TranslatePipe,
  ]
})
export class BalancesPage implements OnInit {
  @ViewChild('balancesReceiveModal', { read: IonModal }) balancesReceiveModal!: IonModal;
  @ViewChild('balancesSelectTokenModal', { read: IonModal }) balancesSelectTokenModal!: IonModal;
  @ViewChild('balancesSendModal', { read: IonModal }) balancesSendModal!: IonModal;
  @ViewChild('manageTokensModal', { read: IonModal }) manageTokensModal!: IonModal;

  constructor(
    private router: Router,
    private settingsService: SettingsService,
    private balancesService: BalancesService,
    private walletsService: WalletsService,
  ) {
    addIcons({qrCode,send,swapHorizontal,close,card,});
  }

  refreshCounter: number = 0;
  totalAmount: number = 0;

  selectedBalance: Balance = new Balance();
  isZeroBalancesHidden: boolean = true;

  currencySymbol: string = '';

  currentWallet: Wallet = new Wallet();

  handleRefresh(event: RefresherCustomEvent) {
    this.refreshCounter++;

    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  formatTotalAmount(amount: number): string {
    return this.balancesService.formatTotalAmount(amount);
  }

  openBalancesReceiveModal() {
    this.balancesReceiveModal.present();
  }

  openBalancesSelectTokenModal() {
    this.balancesSelectTokenModal.present();
  }

  openBalancesSendModal(balance: Balance) {
    this.selectedBalance = balance;
    this.balancesSendModal.present();
  }

  openManageTokensModal() {
    this.manageTokensModal.present();
  }

  goToTokenDetails(balance: Balance) {
    balance.token.total_supply = balance.token.total_supply.toString();

    this.router.navigate(['/xterium/token-details'], {
      queryParams: {
        balance: JSON.stringify(balance)
      }
    });
  }

  goToSwap() {
    this.router.navigate(['/xterium/swap']);
  }

  goToCash() {
    this.router.navigate(['/xterium/cash']);
  }

  onTotalAmount(amount: number) {
    this.totalAmount = amount;
  }

  onClickSend() {
    this.balancesSelectTokenModal.dismiss();
    this.balancesSendModal.dismiss();
  }

  async initSettings(): Promise<void> {
    const settings = await this.settingsService.get();
    if (settings) {
      this.currencySymbol = settings.user_preferences.currency.symbol;
    };
  }

  async getCurrentWallet(): Promise<void> {
    const currentWallet = await this.walletsService.getCurrentWallet();
    if (currentWallet) {
      this.currentWallet = currentWallet;
    }
  }

  ngOnInit() {
    this.initSettings();
    this.getCurrentWallet();

    this.walletsService.currentWalletObservable.subscribe(wallet => {
      if (wallet) {
        this.currentWallet = wallet;
      }
    });

    this.settingsService.currentSettingsObservable.subscribe(settings => {
      if (settings) {
        const newValue = settings.user_preferences.hide_zero_balances;
        if (this.isZeroBalancesHidden !== newValue) {
          this.isZeroBalancesHidden = newValue;

          this.refreshCounter++;
        }

        this.currencySymbol = settings.user_preferences.currency.symbol;
      }
    });
  }
}
