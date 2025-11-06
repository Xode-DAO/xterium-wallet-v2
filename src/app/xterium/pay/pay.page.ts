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

import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';

import { PayDetails } from 'src/models/pay.model';

@Component({
  selector: 'app-pay',
  templateUrl: './pay.page.html',
  styleUrls: ['./pay.page.scss'],
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
export class PayPage implements OnInit {

  constructor(private router: Router) {
    addIcons({
      qrCode,
      cloudUpload,
    });
  }

  formatEMVQR(data: string) {
    const parsed: any = {};
    let i = 0;

    while (i < data.length) {
      const tag = data.substring(i, i + 2);
      const len = parseInt(data.substring(i + 2, i + 4), 10);
      const value = data.substring(i + 4, i + 4 + len);

      if (['26', '27', '28', '62', '51'].includes(tag)) {
        parsed[tag] = this.formatEMVQR(value);
      } else {
        parsed[tag] = value;
      }

      i += 4 + len;
    }

    return parsed;
  }

  async scan() {
    const result = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.ALL
    });

    if (!result?.ScanResult) {
      return;
    }

    const parsedEMVQR = this.formatEMVQR(result.ScanResult);
    const payDetails: PayDetails = {
      recipient_name: parsedEMVQR?.['59'] || '',
      account_number:
        parsedEMVQR?.['26']?.['04'] ||
        parsedEMVQR?.['26']?.['01'] ||
        parsedEMVQR?.['27']?.['04'] ||
        parsedEMVQR?.['27']?.['01'] ||
        '',
      amount: parsedEMVQR?.['54'] ? parseFloat(parsedEMVQR['54']) : 0,
    };

    setTimeout(() => {
      this.router.navigate(['/xterium/payment-details'], {
        queryParams: {
          payDetails: JSON.stringify(payDetails)
        }
      });
    }, 500);
  }

  upload() {
    console.log('Upload QR clicked');
  }

  ngOnInit() { }

}
