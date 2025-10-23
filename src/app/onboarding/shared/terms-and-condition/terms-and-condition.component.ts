import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonTitle,
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
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAvatar,
  IonModal,
  IonIcon,
  IonChip,
  IonInput,
  IonButton,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-terms-and-condition',
  templateUrl: './terms-and-condition.component.html',
  styleUrls: ['./terms-and-condition.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonTitle,
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
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonAvatar,
    IonModal,
    IonIcon,
    IonChip,
    IonInput,
    IonButton,
  ],
})
export class TermsAndConditionComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
