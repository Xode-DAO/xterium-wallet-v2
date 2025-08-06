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
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonDatetime,
  IonDatetimeButton,
  IonCard,
  IonAvatar,
  IonModal
} from '@ionic/angular/standalone';

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
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonDatetime,
    IonDatetimeButton,
    IonCard,
    IonAvatar,
    IonModal
  ]
})
export class TransactionHistoryPage implements OnInit {

  constructor() { }

  selectedDate: string = new Date().toISOString();

  ngOnInit() {
  }

}
