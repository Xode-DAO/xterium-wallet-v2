import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import { 
  logoUsd, 
  chevronForwardOutline
} from 'ionicons/icons';

import { MultipayxApiService } from 'src/app/api/multipayx-api/multipayx-api.service';
import { Currency } from 'src/models/currency.model';

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
  ]
})
export class CurrencyComponent  implements OnInit {
  @Output() onSelectedCurrency = new EventEmitter<Currency>();

  constructor(
    private multipayxApiService: MultipayxApiService
  ) {
    addIcons({
      logoUsd,
      chevronForwardOutline
    });
   }

  currencies: Currency[] = [];

  getCurrencies() {
    this.currencies = this.multipayxApiService.getAllCurrencies();
  }

  selectCurrency(currency: Currency) {
    this.onSelectedCurrency.emit(currency);
  }

  ngOnInit() {
    this.getCurrencies();
  }
}
