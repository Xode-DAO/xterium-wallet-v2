import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

import { HeaderComponent } from "src/app/onboarding/shared/header/header.component";

@Component({
  selector: 'app-setup-wallet',
  templateUrl: './setup-wallet.page.html',
  styleUrls: ['./setup-wallet.page.scss'],
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
    IonIcon,
    HeaderComponent
  ]
})
export class SetupWalletPage implements OnInit {

  constructor() {
    addIcons({
      arrowBackOutline,
      close
    });
  }

  ngOnInit() {
  }

}
