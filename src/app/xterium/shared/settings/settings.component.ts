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

import { CurrencyComponent } from '../currency/currency.component';

import { Currency } from 'src/models/currency.model';

import { AuthService } from 'src/app/api/auth/auth.service';
import { SettingsService } from 'src/app/api/settings/settings.service';

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
  ]
})
export class SettingsComponent  implements OnInit {
  @ViewChild('currencyModal', { read: IonModal }) currencyModal!: IonModal;

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,

  ) { }

  selectedCurrency: Currency = new Currency();
  currency: string = '';

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

  async initSettings(): Promise<void> {
      const currencies = await this.settingsService.get();
      if (currencies) {
        this.currency = currencies.user_preferences.currency_code;
  
        this.selectedCurrency = new Currency();
        this.selectedCurrency.code = this.currency;
      };
    }
  
  async selectCurrency(currency: Currency) {
    const currencies = await this.settingsService.get();
  
    if (currencies) {
      currencies.user_preferences.currency_code = currency.code;
      currencies.user_preferences.currency_symbol = currency.symbol;

      await this.settingsService.set(currencies);
    }
    
    this.selectedCurrency = currency;
    this.currencyModal.dismiss();
  }

  ngOnInit() {
    this.initSettings();
  }

}
