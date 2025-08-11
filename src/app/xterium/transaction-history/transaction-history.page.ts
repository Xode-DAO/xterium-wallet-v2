import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonSegmentView,
  IonSegmentContent,
  IonLabel,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonDatetime,
  IonDatetimeButton,
  IonCard,
  IonAvatar,
  IonModal,
  IonIcon,
  IonChip,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  searchOutline,
  arrowUpOutline,
  arrowDownOutline,
  cashOutline,
  cubeOutline,
  swapHorizontalOutline,
  timeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-transaction-history',
  templateUrl: './transaction-history.page.html',
  styleUrls: ['./transaction-history.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonSegmentView,
    IonSegmentContent,
    IonLabel,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonDatetime,
    IonDatetimeButton,
    IonCard,
    IonAvatar,
    IonModal,
    IonIcon,
    IonChip,
    IonInput,
    IonButton
  ]
})
export class TransactionHistoryPage implements OnInit {

  constructor() {
    addIcons({
      searchOutline,
      arrowUpOutline,
      arrowDownOutline,
      cashOutline,
      cubeOutline,
      swapHorizontalOutline,
      timeOutline
    });
  }

  selectedDate: string = new Date().toISOString();

  ngOnInit() {
  }

}
