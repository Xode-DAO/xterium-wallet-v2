import { Component, OnInit } from '@angular/core';
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

import { TokensComponent } from "src/app/xterium/shared/tokens/tokens.component"
import { ReceiveComponent } from "src/app/xterium/shared/receive/receive.component";

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
    ReceiveComponent
  ]
})
export class BalancesPage implements OnInit {

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

  handleRefresh(event: RefresherCustomEvent) {
    this.refreshCounter++;

    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  goToTokenDetails() {
    this.router.navigate(['/xterium/token-details']);
  }

  goToSwap() {
    this.router.navigate(['/xterium/swap']);
  }

  ngOnInit() { }

}
