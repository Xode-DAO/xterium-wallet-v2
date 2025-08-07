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

import { ReceiveComponent } from "./../../shared/receive/receive.component";

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

  constructor() {
    addIcons({
      arrowBackOutline,
      qrCode,
      send,
      swapHorizontal,
    });
  }

  presentingElement!: HTMLElement | null;

  ngOnInit() {
    this.presentingElement = document.querySelector('.xterium-content');
  }

}
