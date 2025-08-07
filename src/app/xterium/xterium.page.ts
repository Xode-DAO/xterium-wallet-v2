import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonModal,
  IonList,
  IonItemDivider,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonTextarea,
  IonLabel
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  addCircle,
  settingsOutline,
  close,
  briefcase,
  swapHorizontal,
  qrCode,
  timer,
  compass,
  copyOutline,
  clipboardOutline
} from 'ionicons/icons';

import { WalletsComponent } from "./shared/wallets/wallets.component"

@Component({
  selector: 'app-xterium',
  templateUrl: './xterium.page.html',
  styleUrls: ['./xterium.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonModal,
    IonList,
    IonItemDivider,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonInput,
    IonTextarea,
    IonLabel,
    WalletsComponent
  ]
})
export class XteriumPage implements OnInit {

  constructor() {
    addIcons({
      addCircle,
      settingsOutline,
      close,
      briefcase,
      swapHorizontal,
      qrCode,
      timer,
      compass,
      copyOutline,
      clipboardOutline
    });
  }

  presentingElement!: HTMLElement | null;
  importPresentingElement!: HTMLElement | null;

  mnemonicName: string = '';
  mnemonicWords: string[] = new Array(12).fill('Sample');
  privateKeyInput: string = '';

  copyToClipboard() {

  }

  pasteFromClipboard() {

  }

  ngOnInit() {
    this.presentingElement = document.querySelector('.xterium-content');
    this.importPresentingElement = document.querySelector('.my-wallets');
  }

}
