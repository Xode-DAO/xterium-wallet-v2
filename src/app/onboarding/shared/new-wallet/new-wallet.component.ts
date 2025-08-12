import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonLabel
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, copyOutline, close } from 'ionicons/icons';

@Component({
  selector: 'app-new-wallet',
  templateUrl: './new-wallet.component.html',
  styleUrls: ['./new-wallet.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonInput,
    IonLabel,
  ]
})
export class NewWalletComponent implements OnInit {

  constructor() {
    addIcons({
      arrowBackOutline,
      copyOutline,
      close
    });
  }

  walletName: string = '';
  mnemonicPhrase: string[] = new Array(12).fill('Sample');

  copyToClipboard() {

  }

  ngOnInit() { }

}
