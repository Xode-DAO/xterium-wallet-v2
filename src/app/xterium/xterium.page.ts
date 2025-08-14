import { Component, OnInit, ViewChild } from '@angular/core';
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

import { Wallet } from 'src/models/wallet.model';

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
  @ViewChild('myWalletsModal', { read: IonModal }) myWalletsModal!: IonModal;
  @ViewChild('createWalletModal', { read: IonModal }) createWalletModal!: IonModal;
  @ViewChild('createNewAccountModal', { read: IonModal }) createNewAccountModal!: IonModal;
  @ViewChild('importSeedPhraseModal', { read: IonModal }) importSeedPhraseModal!: IonModal;
  @ViewChild('importPrivateKeyModal', { read: IonModal }) importPrivateKeyModal!: IonModal;
  @ViewChild('importFromBackupModal', { read: IonModal }) importFromBackupModal!: IonModal;
  @ViewChild('settingsModal', { read: IonModal }) settingsModal!: IonModal;

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

  mainPresentingElement!: HTMLElement | undefined;
  myWalletsPresentingElement!: HTMLElement | undefined;

  newlyAddedWallet: Wallet = {} as Wallet;

  openMyWalletsModal() {
    this.myWalletsModal.present();
  }

  openCreateWalletModal() {
    this.createWalletModal.present();
  }

  openCreateNewAccountModal() {
    this.createNewAccountModal.present();
  }

  onWalletCreated(wallet: Wallet) {
    this.newlyAddedWallet = wallet;

    this.createNewAccountModal.dismiss();
    this.createWalletModal.dismiss();
  }

  openImportSeedPhraseModal() {
    this.importSeedPhraseModal.present();
  }

  openImportPrivateKeyModal() {
    this.importPrivateKeyModal.present();
  }

  openImportFromBackupModal() {
    this.importFromBackupModal.present();
  }

  openSettingsModal() {
    this.settingsModal.present();
  }

  ngOnInit() {
    this.mainPresentingElement = document.querySelector('.xterium-content') as HTMLElement | undefined;
    this.myWalletsPresentingElement = document.querySelector('.my-wallets') as HTMLElement | undefined;
  }

}
