import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonButton,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { qrCode, cloudUpload } from 'ionicons/icons';

@Component({
  selector: 'app-select-pay',
  templateUrl: './select-pay.page.html',
  styleUrls: ['./select-pay.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonButton,
  ]
})
export class SelectPayPage implements OnInit {

  constructor(private router: Router) {
    addIcons({
      qrCode,
      cloudUpload,
    });
  }

  selectScan() {
    this.router.navigate(['/xterium/pay/qr-scanner']);
  }

  selectUploadQR() {
    this.router.navigate(['/xterium/pay/qr-upload']);
  }

  ngOnInit() {
  }

}
