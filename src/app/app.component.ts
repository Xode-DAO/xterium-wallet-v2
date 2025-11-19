import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { v4 as uuidv4 } from 'uuid';

import { StatusBar, Style } from '@capacitor/status-bar';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

import { Platform } from '@ionic/angular';
import {
  IonApp,
  IonRouterOutlet,
  IonContent,
  IonFooter,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonToolbar,
  IonTitle,
  IonButton,
  IonButtons,
  IonModal,
  IonIcon,
  IonInput,
  IonInputOtp,
  ToastController,
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

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { DeepLinkService } from 'src/app/api/deep-link/deep-link.service';
import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';

import { WalletV1Mobile, WalletV1ChromeExtension, Wallet } from 'src/models/wallet.model';
import { Network } from 'src/models/network.model';

import { SignWalletComponent } from 'src/app/onboarding/shared/sign-wallet/sign-wallet.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonApp,
    IonRouterOutlet,
    IonContent,
    IonFooter,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonToolbar,
    IonTitle,
    IonButton,
    IonButtons,
    IonModal,
    IonIcon,
    IonInput,
    IonInputOtp,
    SignWalletComponent,
  ],
})
export class AppComponent {
  @ViewChild('existingWalletsModal', { read: IonModal }) existingWalletsModal!: IonModal;
  @ViewChild('enterOldPinModal', { read: IonModal }) enterOldPinModal!: IonModal;
  @ViewChild('confirmSyncWalletsModal', { read: IonModal }) confirmSyncWalletsModal!: IonModal;

  constructor(
    private platform: Platform,
    private router: Router,
    private environmentService: EnvironmentService,
    private deepLinkService: DeepLinkService,
    private encryptionService: EncryptionService,
    private utilsService: UtilsService,
    private walletsService: WalletsService,
    private chainsService: ChainsService,
    private onboardingService: OnboardingService,
    private toastController: ToastController,
  ) {
    this.initApp();

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
  }

  isChromeExtension = false;

  existingWallets: WalletV1Mobile[] | WalletV1ChromeExtension[] = [];
  previousPassword: string = '';
  isProcessing = false;

  initApp() {
    this.platform.ready().then(async () => {
      this.isChromeExtension = this.environmentService.isChromeExtension();

      await this.initStatusBar();
      await this.initNotifications();

      await this.checkExistingWallets();

      this.initDeepLinks();
    });
  }

  async initStatusBar() {
    try {
      if (this.isChromeExtension) return;

      await StatusBar.setBackgroundColor({ color: '#1B1B1B' });
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setOverlaysWebView({ overlay: false });

      console.log(await StatusBar.getInfo());
    } catch (error) {
      console.error('StatusBar setup failed:', error);
    }
  }

  async initNotifications() {
    await LocalNotifications.requestPermissions();
  }

  async checkExistingWallets() {
    if (this.isChromeExtension) {
      const existingStorage = await chrome.storage.local.get(['wallets']);
      if (!existingStorage || !existingStorage['wallets'] || existingStorage['wallets'].length === 0) {
        return;
      }

      this.existingWalletsModal.present();

      const existingWallets = existingStorage['wallets'];
      for (const wallet of existingWallets) {
        const walletV1ChromeExtension = new WalletV1ChromeExtension();
        walletV1ChromeExtension.id = wallet.id;
        walletV1ChromeExtension.name = wallet.name;
        walletV1ChromeExtension.mnemonic_phrase = wallet.mnemonic_phrase;
        walletV1ChromeExtension.public_key = wallet.public_key;
        walletV1ChromeExtension.secret_key = wallet.secret_key;
        walletV1ChromeExtension.private_key = wallet.private_key;
        walletV1ChromeExtension.type = wallet.type;
        walletV1ChromeExtension.address_type = wallet.address_type;

        let isDuplicate = false;
        for (const existingWallet of this.existingWallets) {
          if (existingWallet.public_key === walletV1ChromeExtension.public_key) {
            isDuplicate = true;
            break;
          }
        }

        if (isDuplicate) {
          continue;
        }

        this.existingWallets.push(walletV1ChromeExtension);
      }
    } else {

    }
  }

  async backupAndSyncWallets() {
    this.enterOldPinModal.present();
  }

  maskPin(event: any) {
    const inputs = document.querySelectorAll<HTMLInputElement>('#otpInput input');
    inputs.forEach((input) => {
      input.type = 'password';
    });
  }

  onPinChange(event: any) {
    this.previousPassword = event.detail.value;
  }

  async proceedBackupAndSyncWallets() {
    if (this.existingWallets.length === 0) {
      return;
    }

    if (this.isChromeExtension) {
      const existingStorage = await chrome.storage.local.get(['user']);
      if (!existingStorage || !existingStorage['user']) {
        const toast = await this.toastController.create({
          message: 'No user authentication found.',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
        return;
      }

      const hashedPreviousPassword = existingStorage['user'];
      const hashedCurrentPassword = await this.encryptionService.hash(this.previousPassword);

      if (hashedPreviousPassword !== hashedCurrentPassword) {
        const toast = await this.toastController.create({
          message: 'Invalid password. Please try again.',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
        return;
      }
    } else {

    }

    this.confirmSyncWalletsModal.present();
  }

  async confirmSyncWallets(newPassword: string) {
    this.confirmSyncWalletsModal.dismiss();
    this.enterOldPinModal.dismiss();

    for (const wallet of this.existingWallets) {
      wallet.mnemonic_phrase = await this.encryptionService.decrypt(wallet.mnemonic_phrase, this.previousPassword);
      wallet.private_key = await this.encryptionService.decrypt(wallet.private_key, this.previousPassword);
    }

    const walletData = JSON.stringify(this.existingWallets, null, 2);
    const fileName = 'xterium_v1_wallets_backup.json';

    if (Capacitor.isNativePlatform()) {
      this.isProcessing = true;

      const base64Data = btoa(unescape(encodeURIComponent(walletData)));

      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true
      });

      let fileUri = result.uri;

      if (Capacitor.getPlatform() === 'android') {
        const fileInfo = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache
        });
        fileUri = fileInfo.uri;
      }

      await Share.share({
        title: "Xterium Wallet V1 Backup",
        text: 'Wallet backup file',
        url: fileUri,
        dialogTitle: 'Save as JSON'
      });

      const toast = await this.toastController.create({
        message: 'Wallet export shared!',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    } else {
      this.isProcessing = true;

      const blob = new Blob([walletData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const toast = await this.toastController.create({
        message: 'Wallets has been backed up successfully!',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    }

    for (const existingWallet of this.existingWallets) {
      const privateKeyHex = existingWallet.private_key;

      let validatedKeypair = await this.utilsService.validatePrivateKey(privateKeyHex);
      if (validatedKeypair && !validatedKeypair.valid) {
        this.isProcessing = false;

        const toast = await this.toastController.create({
          message: 'Invalid private key: ' + validatedKeypair.error,
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
        return;
      }

      let mnemonicPhrase = "-";
      let publicKey = validatedKeypair.publicKey;
      let privateKey = validatedKeypair.secretKey;

      if (existingWallet.mnemonic_phrase !== "" && existingWallet.mnemonic_phrase !== "-") {
        const decryptedMnemonicPhrase = existingWallet.mnemonic_phrase;

        let isMnemonicPhraseValid = await this.utilsService.validateMnemonic(decryptedMnemonicPhrase);
        if (!isMnemonicPhraseValid) {
          this.isProcessing = false;

          const toast = await this.toastController.create({
            message: 'Invalid mnemonic phrase!',
            color: 'danger',
            duration: 1500,
            position: 'top',
          });

          await toast.present();
          return;
        }

        const seed: Uint8Array = await this.utilsService.generateMnemonicToMiniSecret(decryptedMnemonicPhrase);
        const keypair = await this.utilsService.createKeypairFromSeed(seed);

        mnemonicPhrase = decryptedMnemonicPhrase;
        publicKey = keypair.publicKey;
        privateKey = keypair.secretKey;
      }

      let newId = uuidv4();

      let getExistingWallet = await this.walletsService.getWalletById(newId);
      if (getExistingWallet) {
        this.isProcessing = false;

        const toast = await this.toastController.create({
          message: 'Wallet already exists!',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
        return;
      }

      const chains = this.chainsService.getChainsByNetwork(Network.Polkadot);
      if (chains.length === 0) {
        this.isProcessing = false;

        const toast = await this.toastController.create({
          message: 'No chains available. Please try again later.',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
        return;
      }

      const encryptedMnemonicPhrase = mnemonicPhrase !== "-" ? await this.encryptionService.encrypt(mnemonicPhrase, newPassword) : "-";
      const encryptedPrivateKey = await this.encryptionService.encrypt(privateKey!.toString(), newPassword);

      const wallet: Wallet = {
        id: newId,
        name: existingWallet.name,
        chain: chains[0],
        mnemonic_phrase: encryptedMnemonicPhrase,
        public_key: publicKey?.toString() || "",
        private_key: encryptedPrivateKey
      };

      await this.walletsService.create(wallet);

      let updateOnboarding = false;

      const wallets = await this.walletsService.getAllWallets();
      if (wallets.length === 1) {
        await this.walletsService.setCurrentWallet(newId);
        updateOnboarding = true;
      }

      for (let i = 1; i < chains.length; i++) {
        newId = uuidv4();

        const wallet: Wallet = {
          id: newId,
          name: existingWallet.name,
          chain: chains[i],
          mnemonic_phrase: encryptedMnemonicPhrase,
          public_key: publicKey?.toString() || "",
          private_key: encryptedPrivateKey
        };

        await this.walletsService.create(wallet);
      }

      if (this.isChromeExtension) {
        const newlySavedWallets = await this.walletsService.getAllWallets();
        const encodedWallets = await Promise.all(
          newlySavedWallets.map(async (wallet) => {
            const publicKeyU8a = new Uint8Array(
              wallet.public_key.split(",").map((byte) => Number(byte.trim()))
            );

            return {
              address: await this.utilsService.encodePublicAddressByChainFormat(publicKeyU8a, 0),
              name: wallet.name,
            };
          })
        );

        chrome.storage.local.set({ accounts: encodedWallets });
      }

      if (updateOnboarding) {
        const selectedChain = this.chainsService.getChainsByNetwork(Network.Polkadot);
        await this.onboardingService.set({
          step1_selected_chain: selectedChain[0],
          step2_accepted_terms: true,
          step3_created_wallet: wallet,
          step4_completed: true,
        });
      }
    }

    const toast = await this.toastController.create({
      message: 'Wallet synced successfully!',
      color: 'success',
      duration: 1500,
      position: 'top',
    });

    await toast.present();

    if (this.isChromeExtension) {
      chrome.storage.local.remove('current_page');
      chrome.storage.local.remove('prices:USD');
      chrome.storage.local.remove('selected_network');
      chrome.storage.local.remove('selected_wallet');
      chrome.storage.local.remove('user');
      chrome.storage.local.remove('user_access_time');
      chrome.storage.local.remove('wallets');
      chrome.storage.local.remove('websites');
    } else {

    }

    this.isProcessing = false;

    this.existingWalletsModal.canDismiss = true;
    this.existingWalletsModal.dismiss();

    this.router.navigate(['/xterium'], { replaceUrl: true });
  }

  initDeepLinks() {
    this.deepLinkService.initDeepLinks();
  }
}
