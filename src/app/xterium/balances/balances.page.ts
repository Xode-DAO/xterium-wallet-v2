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
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { qrCode, send, swapHorizontal } from 'ionicons/icons';

import { Balance } from 'src/models/balance.model';

import { TokensComponent } from "src/app/xterium/shared/tokens/tokens.component"
import { ReceiveComponent } from "src/app/xterium/shared/receive/receive.component";
import { SendComponent } from "src/app/xterium/shared/send/send.component"

import { SettingsService } from 'src/app/api/settings/settings.service';
import { BalancesService } from 'src/app/api/balances/balances.service';

import { TranslatePipe } from '@ngx-translate/core';

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
    IonToggle,
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
  ) {
    addIcons({
      qrCode,
      send,
      swapHorizontal,
    });
  }

  refreshCounter: number = 0;
  totalAmount: number = 0;

  selectedBalance: Balance = new Balance();
  isZeroBalancesHidden: boolean = true;

  currencySymbol: string = '';

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

  onTotalAmount(amount: number) {
    this.totalAmount = amount;
  }

  onClickSend(_: string) {
    this.balancesSelectTokenModal.dismiss();
    this.balancesSendModal.dismiss();
  }

  async initSettings(): Promise<void> {
    const settings = await this.settingsService.get();
    if (settings) {
      this.isZeroBalancesHidden = settings.user_preferences.hide_zero_balances;
      this.currencySymbol = settings.user_preferences.currency.symbol;
    };
  }

  async hideZeroBalances(event: any): Promise<void> {
    const isHidden = event.detail.checked;
    const settings = await this.settingsService.get();

    if (settings) {
      settings.user_preferences.hide_zero_balances = isHidden;
      this.settingsService.set(settings);

      this.refreshCounter++;
    }
  }

  ngOnInit() {
    this.initSettings();
    this.settingsService.currentSettingsObservable.subscribe(settings => {
      if (settings) {
        this.initSettings();
      }
    });
  }
}
