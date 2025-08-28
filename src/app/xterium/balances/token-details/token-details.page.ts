import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, qrCode, send, swapHorizontal } from 'ionicons/icons';

import { Balance } from 'src/models/balance.model';
import { Network } from 'src/models/network.model';

import { BalancesService } from 'src/app/api/balances/balances.service';
import { NetworksService } from 'src/app/api/networks/networks.service';

import { ReceiveComponent } from "src/app/xterium/shared/receive/receive.component";

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
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonModal,
    IonTitle,
    IonToolbar,
    ReceiveComponent
  ]
})
export class TokenDetailsPage implements OnInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private balancesService: BalancesService,
    private networksService: NetworksService,
  ) {
    addIcons({
      arrowBackOutline,
      qrCode,
      send,
      swapHorizontal,
    });
  }

  balance: Balance = {} as Balance;

  goToSwap() {
    this.router.navigate(['/xterium/swap']);
  }

  getNetworkName(networkId: number): string {
    const network = this.networksService.getNetworkById(networkId);
    if (!network) {
      return "";
    }

    return network.name;
  }

  formatBalance(amount: number, decimals: number): number {
    return this.balancesService.formatBalance(amount, decimals);
  }

  formatBalanceWithSuffix(amount: number, decimals: number): string {
    return this.balancesService.formatBalanceWithSuffix(amount, decimals);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['balance']) {
        this.balance = JSON.parse(params['balance']);
      }
    });
  }
}
