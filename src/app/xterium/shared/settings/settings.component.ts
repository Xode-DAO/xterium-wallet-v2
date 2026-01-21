import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonIcon,
  IonModal,
  IonToggle,
  AlertController,
  ToastController,
  ActionSheetController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  close,
  logOutOutline,
  logoUsd,
  languageOutline,
  fingerPrintOutline,
  codeOutline
} from 'ionicons/icons';

import { CurrencyComponent } from './currency/currency.component';
import { LanguageComponent } from './language/language.component';
import { PinLoginComponent } from 'src/app/security/shared/pin-login/pin-login.component';
import { BiometricComponent } from 'src/app/security/shared/biometric/biometric.component';
import { PinSetupComponent } from 'src/app/security/shared/pin-setup/pin-setup.component';

import { Currency } from 'src/models/currency.model';
import { LanguageTranslation } from 'src/models/language-translation.model';
import { Network } from 'src/models/network.model';
import { Auth } from 'src/models/auth.model';


import { AuthService } from 'src/app/api/auth/auth.service';
import { SettingsService } from 'src/app/api/settings/settings.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { BiometricService } from 'src/app/api/biometric/biometric.service';
import { EncryptionService } from 'src/app/api/encryption/encryption.service';

import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonIcon,
    IonModal,
    IonToggle,
    CurrencyComponent,
    LanguageComponent,
    TranslatePipe,
    PinLoginComponent,
    BiometricComponent,
    PinSetupComponent,
  ]
})

export class SettingsComponent implements OnInit {
  @ViewChild('currencyModal', { read: IonModal }) currencyModal!: IonModal;
  @ViewChild('languageModal', { read: IonModal }) languageModal!: IonModal;
  @ViewChild('confirmBiometricModal', { read: IonModal }) confirmBiometricModal!: IonModal;

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService,
    private walletsService: WalletsService,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private alertController: AlertController,
    private encryptionService: EncryptionService,
    private biometricService : BiometricService

  ) {
    addIcons({
      close,
      logOutOutline,
      logoUsd,
      languageOutline,
      fingerPrintOutline,
      codeOutline
    });
  }

  selectedCurrency: Currency = new Currency();
  selectedLanguage: LanguageTranslation = new LanguageTranslation();
  code: string = '';

  isTestnetEnabled: boolean = false;

  currentAuth: Auth | null = null;
  isBiometricAvailable: boolean = false;

  isBiometricEnabled: boolean = false;
  biometricModalMode: 'enable' | 'disable' | 'setup-pin' | null = null;

  decryptedPassword: string = '';

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

  async openCurrencyModal() {
    this.currencyModal.present();
  }

  async openLanguageModal() {
    this.languageModal.present();
  }

  async selectCurrency(currency: Currency) {
    const currencies = await this.settingsService.get();

    if (currencies) {
      currencies.user_preferences.currency.code = currency.code;
      currencies.user_preferences.currency.symbol = currency.symbol;

      await this.settingsService.set(currencies);
    }

    this.selectedCurrency = currency;
    this.currencyModal.dismiss();
  }

  async selectLanguage(language: LanguageTranslation) {
    const languages = await this.settingsService.get();

    if (languages) {
      languages.user_preferences.language.code = language.code;
      languages.user_preferences.language.name = language.name;
      languages.user_preferences.language.nativeName = language.nativeName;

      await this.settingsService.set(languages);
    }

    this.selectedLanguage = language;
    this.languageModal.dismiss();
  }

  async onBiometricToggle(event: any) {
    const enable = event.detail.checked;

    const auth = await this.authService.getAuth();
    if (auth) {
      this.currentAuth = auth;
    }

    if (!enable) {
      const alert = await this.alertController.create({
        header: 'Disable Biometric',
        message: 'Are you sure you want to disable biometric authentication?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              this.isBiometricEnabled = false;
            }
          },
          {
            text: 'Yes',
            role: 'confirm',
            handler: async () => {
              this.biometricModalMode = 'disable';

              await this.confirmBiometricModal.present();
            }
          }
        ]
      });
      await alert.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Enable Biometric',
      message: 'Do you want to enable biometric authentication?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.isBiometricEnabled = false;
          }
        },
        {
          text: 'Yes',
          role: 'confirm',
          handler: async () => {
            this.biometricModalMode = 'enable';

            await this.confirmBiometricModal.present();
          }
        }
      ]
    });

    await alert.present();
  }

  async onBiometricSetup(decryptedPassword: string) {
    const wallets = await this.walletsService.getAllWallets();

    const decryptedWallets = await Promise.all(
      wallets.map(async wallet => ({
        id: wallet.id,
        mnemonic: await this.encryptionService.decrypt(wallet.mnemonic_phrase, decryptedPassword),
        privateKey: await this.encryptionService.decrypt(wallet.private_key, decryptedPassword)
      }))
    );

    const availability = await this.biometricService.isAvailable();
    this.isBiometricAvailable = availability.available;

    if (!this.isBiometricAvailable) {
      const toast = await this.toastController.create({
        message: 'Biometric not available on this device.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });
      await toast.present();
      return;
    }

    await this.biometricService.enableBiometric();
    await this.biometricService.setCredentials();
    const credentials = await this.biometricService.getCredentials();

    const encryptedPassword = await this.encryptionService.encrypt(credentials.password, credentials.password);
    await this.authService.setupPassword(encryptedPassword, 'biometric');

    for (const wallet of decryptedWallets) {
      const encryptedMnemonic = await this.encryptionService.encrypt(wallet.mnemonic, credentials.password);
      const encryptedPrivateKey = await this.encryptionService.encrypt(wallet.privateKey, credentials.password);
      await this.walletsService.update(wallet.id, {
        mnemonic_phrase: encryptedMnemonic,
        private_key: encryptedPrivateKey
      });
    }

    
    const settings = await this.settingsService.get();

    if (!settings) return;

    settings.user_preferences.biometric_enabled = true;
    await this.settingsService.set(settings);

    this.isBiometricEnabled = true;
    
    await this.confirmBiometricModal.dismiss();

    const toast = await this.toastController.create({
      message: 'Biometric enable.',
      color: 'success',
      duration: 1500,
      position: 'top',
    });
    await toast.present();
  }

  async onBiometricAuthenticated(decryptedPassword: string) {
    this.decryptedPassword = decryptedPassword;
    
    this.biometricModalMode = 'setup-pin';
  }

  async onPinSetup(newPin: string) {
    
    if (!newPin) {
      const toast = await this.toastController.create({
        message: 'PIN was not provided. Please try again.',
        color: 'danger',
        duration: 2000,
        position: 'top',
      });
      await toast.present();
      return;
    }

    const wallets = await this.walletsService.getAllWallets();

    const decryptedWallets = await Promise.all(
      wallets.map(async wallet => ({
        id: wallet.id,
        mnemonic: await this.encryptionService.decrypt(wallet.mnemonic_phrase, this.decryptedPassword),
        privateKey: await this.encryptionService.decrypt(wallet.private_key, this.decryptedPassword)
      }))
    );

    const encryptedPassword = await this.encryptionService.encrypt(newPin, newPin);
    await this.authService.setupPassword(encryptedPassword, 'pin');

    for (const wallet of decryptedWallets) {
      const encryptedMnemonic = await this.encryptionService.encrypt(wallet.mnemonic, newPin);
      const encryptedPrivateKey = await this.encryptionService.encrypt(wallet.privateKey, newPin);
      await this.walletsService.update(wallet.id, {
        mnemonic_phrase: encryptedMnemonic,
        private_key: encryptedPrivateKey
      });
    }

    const settings = await this.settingsService.get();

    if (!settings) return;

    settings.user_preferences.biometric_enabled = false;
    await this.settingsService.set(settings);

    this.isBiometricEnabled = true;

    this.decryptedPassword = '';
    this.biometricModalMode = null;

    await this.confirmBiometricModal.dismiss();

    const toast = await this.toastController.create({
      message: 'Biometric disabled.',
      color: 'success',
      duration: 1500,
      position: 'top',
    });
    await toast.present();
  }

  async developerMode(event: any): Promise<void> {
    const settings = await this.settingsService.get();
    if (settings) {
      settings.user_preferences.testnet_enabled = event.target.checked;
      await this.settingsService.set(settings);

      if (event.detail.checked) {
        const alert = await this.alertController.create({
          header: 'Enable Testnet',
          message: 'By enabling testnet, you can access test networks like Rococo and Paseo. Please note that test networks may be unstable and are intended for development and testing purposes only.',
          buttons: [
            {
              text: 'Ok',
              role: 'confirm'
            },
          ],
        });

        await alert.present();
        this.isTestnetEnabled = true;
      } else {
        const wallets = await this.walletsService.getAllWallets();
        if (wallets.length > 0) {
          const currentWallet = await this.walletsService.getCurrentWallet();
          if (currentWallet) {
            if (currentWallet.chain.network !== Network.Polkadot) {
              const firstWallet = wallets[0];
              if (firstWallet) {
                await this.walletsService.setCurrentWallet(firstWallet.id);
              }
            }
          }
        }
        this.isTestnetEnabled = false;
      }
    }
  }

  async ngOnInit() {
    const settings = await this.settingsService.get();
    if (settings) {
      this.selectedCurrency = settings.user_preferences.currency;
      this.selectedLanguage = settings.user_preferences.language;
      this.isTestnetEnabled = settings.user_preferences.testnet_enabled;
      if (this.currentAuth?.type === 'biometric') {
        settings.user_preferences.biometric_enabled = true;
        await this.settingsService.set(settings);
        this.isBiometricEnabled = true;
      } else {
      this.isBiometricEnabled = settings.user_preferences.biometric_enabled;
      }
    }
  }
}
