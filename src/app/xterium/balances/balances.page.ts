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
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { qrCode, send, swapHorizontal } from 'ionicons/icons';

import { Balance } from 'src/models/balance.model';

import { TokensComponent } from "src/app/xterium/shared/tokens/tokens.component"
import { ReceiveComponent } from "src/app/xterium/shared/receive/receive.component";
import { SendComponent } from "src/app/xterium/shared/send/send.component"

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
    TokensComponent,
    ReceiveComponent,
    SendComponent
  ]
})
export class BalancesPage implements OnInit {
  @ViewChild('balancesReceiveModal', { read: IonModal }) balancesReceiveModal!: IonModal;
  @ViewChild('balancesSelectTokenModal', { read: IonModal }) balancesSelectTokenModal!: IonModal;
  @ViewChild('balancesSendModal', { read: IonModal }) balancesSendModal!: IonModal;
  @ViewChild('manageTokensModal', { read: IonModal }) manageTokensModal!: IonModal;

  constructor(
    private router: Router
  ) {
    addIcons({
      qrCode,
      send,
      swapHorizontal,
    });
  }

  refreshCounter: number = 0;
  totalAmount: number = 0;

  handleRefresh(event: RefresherCustomEvent) {
    this.refreshCounter++;

    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  openBalancesReceiveModal() {
    this.balancesReceiveModal.present();
  }

  openBalancesSelectTokenModal() {
    this.balancesSelectTokenModal.present();
  }

  openBalancesSendModal(balance: Balance) {
    this.balancesSendModal.present();
  }

  openManageTokensModal() {
    this.manageTokensModal.present();
  }

  goToTokenDetails(balance: Balance) {
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

  ngOnInit() { }

}
