import { Component, OnInit } from '@angular/core';

import {
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonModal,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';

import { WalletDetailsComponent } from "./wallet-details/wallet-details.component";

@Component({
  selector: 'app-wallets',
  templateUrl: './wallets.component.html',
  styleUrls: ['./wallets.component.scss'],
  imports: [
    IonContent,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonModal,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    WalletDetailsComponent
  ]
})
export class WalletsComponent implements OnInit {

  constructor() { }

  mainPresentingElement!: HTMLElement | null;

  ngOnInit() {
    this.mainPresentingElement = document.querySelector('.my-wallets');
  }

}
