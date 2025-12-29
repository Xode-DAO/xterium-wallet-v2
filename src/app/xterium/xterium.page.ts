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
  IonLabel,
  IonModal,
  IonBadge,
  IonAvatar
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  addCircle,
  settingsOutline,
  notificationsOutline,
  close,
  briefcase,
  swapHorizontal,
  qrCode,
  timer,
  compass,
  chevronDownOutline,
} from 'ionicons/icons';

import { NetworksComponent } from './shared/networks/networks.component';
import { WalletsComponent } from "src/app/xterium/shared/wallets/wallets.component";
import { NewWalletComponent } from "src/app/onboarding/shared/new-wallet/new-wallet.component";
import { ImportSeedPhraseComponent } from "src/app/onboarding/shared/import-seed-phrase/import-seed-phrase.component";
import { ImportPrivateKeyComponent } from "src/app/onboarding/shared/import-private-key/import-private-key.component";
import { ImportFromBackupComponent } from "src/app/onboarding/shared/import-from-backup/import-from-backup.component";
import { NotificationsComponent } from './shared/notifications/notifications.component';
import { SettingsComponent } from './shared/settings/settings.component';

import { NetworkMetadata } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model';
import { LocalNotification } from 'src/models/local-notification.model';
import { Settings } from 'src/models/settings.model';

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { NetworkMetadataService } from 'src/app/api/network-metadata/network-metadata.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { AuthService } from 'src/app/api/auth/auth.service';
import { LocalNotificationsService } from '../api/local-notifications/local-notifications.service';
import { SettingsService } from '../api/settings/settings.service';

import { TranslatePipe } from '@ngx-translate/core';

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
    IonLabel,
    IonModal,
    IonBadge,
    IonAvatar,
    NetworksComponent,
    WalletsComponent,
    NewWalletComponent,
    ImportSeedPhraseComponent,
    ImportPrivateKeyComponent,
    ImportFromBackupComponent,
    NotificationsComponent,
    SettingsComponent,
    TranslatePipe,
  ]
})
export class XteriumPage implements OnInit {
  @ViewChild('myWalletsModal', { read: IonModal }) myWalletsModal!: IonModal;
  @ViewChild('createWalletModal', { read: IonModal }) createWalletModal!: IonModal;
  @ViewChild('selectNetworkMetadataModal', { read: IonModal }) selectNetworkMetadataModal!: IonModal;
  @ViewChild('createNewAccountModal', { read: IonModal }) createNewAccountModal!: IonModal;
  @ViewChild('importSeedPhraseModal', { read: IonModal }) importSeedPhraseModal!: IonModal;
  @ViewChild('importPrivateKeyModal', { read: IonModal }) importPrivateKeyModal!: IonModal;
  @ViewChild('importFromBackupModal', { read: IonModal }) importFromBackupModal!: IonModal;
  @ViewChild('notificationsModal', { read: IonModal }) notificationsModal!: IonModal;
  @ViewChild('settingsModal', { read: IonModal }) settingsModal!: IonModal;

  constructor(
    private router: Router,
    private utilsService: UtilsService,
    private networkMetadataService: NetworkMetadataService,
    private walletsService: WalletsService,
    private authService: AuthService,
    private localNotificationsService: LocalNotificationsService,
    private settingsService: SettingsService,
  ) {
    addIcons({
      addCircle,
      notificationsOutline,
      settingsOutline,
      close,
      briefcase,
      swapHorizontal,
      qrCode,
      timer,
      compass,
      chevronDownOutline,
    });

    this.initAuthentication();
  }

  selectedNetworkMetadata: NetworkMetadata = new NetworkMetadata();
  newlyAddedWallet: Wallet = new Wallet();

  currentWallet: Wallet = new Wallet();
  currentWalletPublicAddress: string = '';

  unreadCount: number = 0;
  notifications: LocalNotification[] = [];

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

  openMyWalletsModal() {
    this.myWalletsModal.present();
  }

  onSetCurrentWallet(wallet: Wallet) {
    this.getCurrentWallet();
    this.myWalletsModal.dismiss();
  }

  onFilteredNetworkMetadata(networkMetadata: NetworkMetadata) {
    this.selectedNetworkMetadata = networkMetadata;
  }

  openCreateWalletModal() {
    this.createWalletModal.present();
  }

  openSelectNetworkMetadataModal() {
    this.selectNetworkMetadataModal.present();
  }

  onSelectedNetworkMetadata(networkMetadata: NetworkMetadata) {
    this.selectedNetworkMetadata = networkMetadata;
    this.selectNetworkMetadataModal.dismiss();
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

  async openNotificationsModal() {
    const notifications = await this.localNotificationsService.openNotifications();
    this.unreadCount = notifications.filter(n => !n.is_open).length;

    this.notificationsModal.present();
  }

  async fetchNotifications() {
    this.notifications = await this.localNotificationsService.getAllNotifications();
  }

  openSettingsModal() {
    this.settingsModal.present();
  }

  async initSettings(): Promise<void> {
    const settings = await this.settingsService.get();
    const newSettings: Settings = {
      user_preferences: {
        hide_zero_balances: settings?.user_preferences.hide_zero_balances ?? true,
        currency: settings?.user_preferences.currency || {
          code: "USD",
          symbol: "$"
        },
        language: settings?.user_preferences.language || {
          code: "en",
          name: "English",
          nativeName: "English"
        },
        developer_mode: settings?.user_preferences.developer_mode ?? false,
      }
    };

    await this.settingsService.set(newSettings);

    this.selectedNetworkMetadata = (await this.networkMetadataService.getAllNetworkMetadatas())[1];
  }

  ngOnInit() {
    this.initSettings();

    setTimeout(() => {
      this.getCurrentWallet();
    }, 500);

    this.localNotificationsService.localNotificationObservable.subscribe(async (notification) => {
      if (notification) {
        this.unreadCount = await this.localNotificationsService.getUnreadCount();
      }
      await this.fetchNotifications();
    });

    this.settingsService.currentSettingsObservable.subscribe(async settings => {
      await this.getCurrentWallet();
    });
  }
}
