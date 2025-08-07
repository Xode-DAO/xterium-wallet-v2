import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
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

import { HeaderComponent } from "../shared/header/header.component";

@Component({
  selector: 'app-create-new-wallet',
  templateUrl: './create-new-wallet.page.html',
  styleUrls: ['./create-new-wallet.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonInput,
    IonLabel,
    HeaderComponent
  ]
})
export class CreateNewWalletPage implements OnInit {

  constructor() {
    addIcons({
      arrowBackOutline,
      copyOutline,
      close
    });
  }

  mnemonicName: string = '';
  mnemonicWords: string[] = new Array(12).fill('Sample');

  copyToClipboard() {

  }

  ngOnInit() {
  }

}
