import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { qrCode, send, swapHorizontal } from 'ionicons/icons';

import { TokensComponent } from "./../shared/tokens/tokens.component"

@Component({
  selector: 'app-balances',
  templateUrl: './balances.page.html',
  styleUrls: ['./balances.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonButtons,
    IonIcon,
    IonModal,
    IonTitle,
    IonToolbar,
    TokensComponent
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

  presentingElement!: HTMLElement | null;

  goToTokenDetails() {
    this.router.navigate(['/xterium/token-details']);
  }

  ngOnInit() {
    this.presentingElement = document.querySelector('.xterium-content');
  }

}
