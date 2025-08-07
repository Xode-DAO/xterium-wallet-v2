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
  IonItem,
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
} from 'ionicons/icons';

import { WalletsComponent } from "./shared/wallets/wallets.component"
import { NewWalletComponent } from "./../onboarding/shared/new-wallet/new-wallet.component"
import { ImportSeedPhraseComponent } from "./../onboarding/shared/import-seed-phrase/import-seed-phrase.component"
import { ImportPrivateKeyComponent } from "./../onboarding/shared/import-private-key/import-private-key.component"
import { ImportFromBackupComponent } from "./../onboarding/shared/import-from-backup/import-from-backup.component"

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
    IonItem,
    IonLabel,
    WalletsComponent,
    NewWalletComponent,
    ImportSeedPhraseComponent,
    ImportPrivateKeyComponent,
    ImportFromBackupComponent,
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
      compass
    });
  }

  mainPresentingElement!: HTMLElement | null;
  myWalletsPresentingElement!: HTMLElement | null;

  ngOnInit() {
    this.mainPresentingElement = document.querySelector('.xterium-content');
    this.myWalletsPresentingElement = document.querySelector('.my-wallets');
  }

}
