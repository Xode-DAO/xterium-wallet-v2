import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';

import { HeaderComponent } from "../shared/header/header.component";
import { NewWalletComponent } from "../shared/new-wallet/new-wallet.component";

import { Wallet } from './../../../models/wallet.model';

@Component({
  selector: 'app-create-new-wallet',
  templateUrl: './create-new-wallet.page.html',
  styleUrls: ['./create-new-wallet.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonIcon,
    HeaderComponent,
    NewWalletComponent
  ]
})
export class CreateNewWalletPage implements OnInit {

  constructor(
    private router: Router
  ) {
    addIcons({
      arrowBackOutline,
      close
    });
  }

  onCreatedWallet(wallet: Wallet) {
    this.router.navigate(['/xterium']);
  }

  ngOnInit() {
  }
}
