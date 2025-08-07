import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';

import { HeaderComponent } from "../shared/header/header.component";
import { NewWalletComponent } from "../shared/new-wallet/new-wallet.component";

@Component({
  selector: 'app-create-new-wallet',
  templateUrl: './create-new-wallet.page.html',
  styleUrls: ['./create-new-wallet.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    IonContent,
    IonButton,
    IonIcon,
    HeaderComponent,
    NewWalletComponent
  ]
})
export class CreateNewWalletPage implements OnInit {

  constructor() {
    addIcons({
      arrowBackOutline,
      close
    });
  }

  ngOnInit() {
  }

}
