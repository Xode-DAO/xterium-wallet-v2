import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { 
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { qrCode, cloudUpload } from 'ionicons/icons';

@Component({
  selector: 'app-select-qr-pay',
  templateUrl: './select-qr-pay.page.html',
  styleUrls: ['./select-qr-pay.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, 
    IonButton, 
    IonIcon, 
    IonGrid, 
    IonRow,
    IonCol,
  ]
})
export class SelectQrPayPage implements OnInit {

  constructor( private router: Router ) {
    addIcons({
      qrCode,
      cloudUpload,
    });
   }

  qrCodeScannerNavigation() {
    this.router.navigate(['/xterium/pay/qr-scanner']);
  }

  qrCodeUploadNavigation() {
    this.router.navigate(['/xterium/pay/qr-upload']);
  }

  ngOnInit() {
  }

}
