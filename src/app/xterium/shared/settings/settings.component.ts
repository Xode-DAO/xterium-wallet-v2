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
  ToastController,
  ActionSheetController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  close,
  logOutOutline,
  logoUsd,
  languageOutline
} from 'ionicons/icons';

import { CurrencyComponent } from './currency/currency.component';
import { LanguageComponent } from './language/language.component';

import { Currency } from 'src/models/currency.model';

import { AuthService } from 'src/app/api/auth/auth.service';
import { SettingsService } from 'src/app/api/settings/settings.service';
import { LanguageTranslation } from 'src/models/language-translation.model';

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
    CurrencyComponent,
    LanguageComponent,
    TranslatePipe,
  ]
})
export class SettingsComponent  implements OnInit {
  @ViewChild('currencyModal', { read: IonModal }) currencyModal!: IonModal;
  @ViewChild('languageModal', { read: IonModal }) languageModal!: IonModal;


  constructor(
    private authService: AuthService,
    private settingsService: SettingsService,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,

  ) {
    addIcons({
      close,
      logOutOutline,
      logoUsd,
      languageOutline
    });
  }

  selectedCurrency: Currency = new Currency();
  selectedLanguage: LanguageTranslation = new LanguageTranslation();
  code: string = '';

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

  async ngOnInit() {
    const settings = await this.settingsService.get();
      if (settings) {
        this.selectedCurrency = settings.user_preferences.currency;
        this.selectedLanguage = settings.user_preferences.language;
      }
   }
}
