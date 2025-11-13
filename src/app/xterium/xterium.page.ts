import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonItemDivider,
  IonIcon,
  IonAvatar,
  IonLabel,
  IonModal,
  ToastController,
  ActionSheetController,
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
  chevronDownOutline,
  logOutOutline
} from 'ionicons/icons';

import { NetworksComponent } from "src/app/xterium/shared/networks/networks.component";
import { WalletsComponent } from "src/app/xterium/shared/wallets/wallets.component";
import { NewWalletComponent } from "src/app/onboarding/shared/new-wallet/new-wallet.component";
import { ImportSeedPhraseComponent } from "src/app/onboarding/shared/import-seed-phrase/import-seed-phrase.component";
import { ImportPrivateKeyComponent } from "src/app/onboarding/shared/import-private-key/import-private-key.component";
import { ImportFromBackupComponent } from "src/app/onboarding/shared/import-from-backup/import-from-backup.component";

import { NetworkMetadata } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model';

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { NetworkMetadataService } from 'src/app/api/network-metadata/network-metadata.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { AuthService } from 'src/app/api/auth/auth.service';

@Component({
  selector: 'app-xterium',
  templateUrl: './xterium.page.html',
  styleUrls: ['./xterium.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonItemDivider,
    IonIcon,
    IonAvatar,
    IonLabel,
    IonModal,
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
    private router: Router,
    private utilsService: UtilsService,
    private networkMetadataService: NetworkMetadataService,
    private walletsService: WalletsService,
    private authService: AuthService,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
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
      chevronDownOutline,
      logOutOutline
    });

    this.initAuthentication();
  }

  selectedNetworkMetadata: NetworkMetadata = new NetworkMetadata();
  newlyAddedWallet: Wallet = new Wallet();

  currentWallet: Wallet = new Wallet();
  currentWalletPublicAddress: string = '';

  async encodePublicAddressByChainFormat(publicKey: string, chain: Chain): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = typeof chain.address_prefix === 'number' ? chain.address_prefix : 0;
    return await this.utilsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  async getCurrentWallet(): Promise<void> {
    const currentWallet = await this.walletsService.getCurrentWallet();
    if (currentWallet) {
      this.currentWallet = currentWallet;
      this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, this.currentWallet.chain)
    }
  }

  truncateAddress(address: string): string {
    return this.utilsService.truncateAddress(address);
  }

  async initAuthentication() {
    const auth = await this.authService.getAuth();

    if (auth) {
      const isAuthExpired = auth.expires_at ? Date.now() > auth.expires_at : false;
      if (isAuthExpired) {
        await this.router.navigate(['/security'], { replaceUrl: true });
      } else {
        const wallets = await this.walletsService.getAllWallets();
        const currentWallet = await this.walletsService.getCurrentWallet();

        if (wallets.length === 0 || !currentWallet) {
          localStorage.clear();

          await this.router.navigate(['/onboarding'], { replaceUrl: true });
          return;
        }
      }
    } else {
      localStorage.clear();
      await this.router.navigate(['/onboarding'], { replaceUrl: true });
    }
  }

  async confirmLogout() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Are you sure you want to logout?',
      subHeader: 'You will need to login again.',
      buttons: [
        {
          text: 'Logout',
          role: 'destructive',
          handler: async () => {
            await this.authService.logout();

            actionSheet.dismiss();

            const toast = await this.toastController.create({
              message: 'Logged out successfully!',
              color: 'success',
              duration: 1500,
              position: 'top'
            });

            await toast.present();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  openMyWalletsModal() {
    this.myWalletsModal.present();
  }

  onSetCurrentWallet(wallet: Wallet) {
    this.getCurrentWallet();
    this.myWalletsModal.dismiss();
  }

  openCreateWalletModal() {
    this.createWalletModal.present();
  }

  openSelectNetworkModal() {
    this.selectNetworkModal.present();
  }

  onSelectedNetworkMetadata(networkMetadata: NetworkMetadata) {
    this.selectedNetworkMetadata = networkMetadata;
    this.selectNetworkModal.dismiss();
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

  onImportWalletSeedPhrase(wallet: Wallet) {
    this.newlyAddedWallet = wallet;

    this.createNewAccountModal.dismiss();
    this.importSeedPhraseModal.dismiss();
  }

  openImportPrivateKeyModal() {
    this.importPrivateKeyModal.present();
  }

  onImportWalletPrivateKey(wallet: Wallet) {
    this.newlyAddedWallet = wallet;

    this.createNewAccountModal.dismiss();
    this.importPrivateKeyModal.dismiss();
  }

  openImportFromBackupModal() {
    this.importFromBackupModal.present();
  }

  onImportWalletFromBackup(wallet: Wallet) {
    this.newlyAddedWallet = wallet;

    this.createNewAccountModal.dismiss();
    this.importFromBackupModal.dismiss();
  }

  openSettingsModal() {
    this.settingsModal.present();
  }

  ngOnInit() {
    this.selectedNetworkMetadata = this.networkMetadataService.getAllNetworkMetadatas()[0];

    setTimeout(() => {
      this.getCurrentWallet();
    }, 500);
  }
}
