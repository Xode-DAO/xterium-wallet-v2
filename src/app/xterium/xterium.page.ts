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
  IonAvatar,
  IonLabel,
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
  chevronDownOutline
} from 'ionicons/icons';

import { WalletsComponent } from "./shared/wallets/wallets.component";
import { NetworksComponent } from "./shared/networks/networks.component";
import { NewWalletComponent } from "./../onboarding/shared/new-wallet/new-wallet.component";
import { ImportSeedPhraseComponent } from "./../onboarding/shared/import-seed-phrase/import-seed-phrase.component";
import { ImportPrivateKeyComponent } from "./../onboarding/shared/import-private-key/import-private-key.component";
import { ImportFromBackupComponent } from "./../onboarding/shared/import-from-backup/import-from-backup.component";

import { Wallet } from './../../models/wallet.model';
import { Network } from './../..//models/network.model';

import { NetworksService } from './../api/networks/networks.service';

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
    IonAvatar,
    IonLabel,
    WalletsComponent,
    NetworksComponent,
    NewWalletComponent,
    ImportSeedPhraseComponent,
    ImportPrivateKeyComponent,
    ImportFromBackupComponent,
  ]
})
export class XteriumPage implements OnInit {
  @ViewChild('myWalletsModal', { read: IonModal }) myWalletsModal!: IonModal;
  @ViewChild('createWalletModal', { read: IonModal }) createWalletModal!: IonModal;
  @ViewChild('selectNetworkModal', { read: IonModal }) selectNetworkModal!: IonModal;
  @ViewChild('createNewAccountModal', { read: IonModal }) createNewAccountModal!: IonModal;
  @ViewChild('importSeedPhraseModal', { read: IonModal }) importSeedPhraseModal!: IonModal;
  @ViewChild('importPrivateKeyModal', { read: IonModal }) importPrivateKeyModal!: IonModal;
  @ViewChild('importFromBackupModal', { read: IonModal }) importFromBackupModal!: IonModal;
  @ViewChild('settingsModal', { read: IonModal }) settingsModal!: IonModal;

  constructor(
    private networksService: NetworksService,
  ) {
    addIcons({
      addCircle,
      settingsOutline,
      close,
      briefcase,
      swapHorizontal,
      qrCode,
      timer,
      compass,
      chevronDownOutline
    });
  }

  mainPresentingElement!: HTMLElement | undefined;
  myWalletsPresentingElement!: HTMLElement | undefined;

  selectedNetwork: Network = {} as Network;
  newlyAddedWallet: Wallet = {} as Wallet;

  openMyWalletsModal() {
    this.myWalletsModal.present();
  }

  onSelectedCurrentWallet(wallet: Wallet) {
    this.myWalletsModal.dismiss();
  }

  openCreateWalletModal() {
    this.createWalletModal.present();
  }

  openSelectNetworkModal() {
    this.selectNetworkModal.present();
  }

  onSelectedNetwork(network: Network) {
    this.selectedNetwork = network;
    this.selectNetworkModal.dismiss();
  }

  onFilteredNetwork(network: Network) {
    if (network.name !== "All Networks") {
      this.selectedNetwork = network;
    }
  }

  openCreateNewAccountModal() {
    this.createNewAccountModal.present();
  }

  onCreatedWallet(wallet: Wallet) {
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

    this.selectedNetwork = this.networksService.getNetworksByCategory('Live')[0];
  }
}
