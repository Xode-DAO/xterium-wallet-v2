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
  AlertController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { qrCode, cloudUpload } from 'ionicons/icons';

import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import QrScanner from "qr-scanner";

import { EnvironmentService } from 'src/app/api/environment/environment.service';

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

  constructor(
    private router: Router,
    private environmentService: EnvironmentService,
    private alertController: AlertController
  ) {
    addIcons({
      qrCode,
      cloudUpload,
    });
  }

  isChromeExtension = false;

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
    if (this.isChromeExtension) {
      const alert = await this.alertController.create({
        header: 'Scanning Not Supported',
        subHeader: 'Chrome Extension Limitation',
        message: 'Scanning QR codes is not supported in the Chrome Extension version of the app. Please use the mobile app to scan QR codes.',
        backdropDismiss: true,
        buttons: ['Ok'],
      });

      await alert.present();
      return;
    }


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

    if (!payDetails.account_number && !payDetails.recipient_name) {
      const alert = await this.alertController.create({
        header: 'Invalid QR',
        message: 'The QR code does not contain valid account information.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    setTimeout(() => {
      this.router.navigate(['/xterium/payment-details'], {
        queryParams: {
          payDetails: JSON.stringify(payDetails)
        }
      });
    }, 500);
  }

  async upload() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        try {
          const qrText = await QrScanner.scanImage(file);

          const parsedEMVQR = this.formatEMVQR(qrText);

          const payDetails: PayDetails = {
            recipient_name: parsedEMVQR?.['59'] || '',
            account_number:
              parsedEMVQR?.['26']?.['04'] ||
              parsedEMVQR?.['26']?.['01'] ||
              parsedEMVQR?.['27']?.['04'] ||
              parsedEMVQR?.['27']?.['01'] || '',
            amount: parsedEMVQR?.['54'] ? parseFloat(parsedEMVQR['54']) : 0,
          };

          if (!payDetails.account_number && !payDetails.recipient_name) {
            const alert = await this.alertController.create({
              header: 'Invalid QR',
              message: 'The QR code does not contain valid account information.',
              buttons: ['OK']
            });
            await alert.present();
            return;
          }

          this.router.navigate(['/xterium/payment-details'], {
            queryParams: {
              payDetails: JSON.stringify(payDetails)
            }
          });

        } catch (err) {
          console.error('QR decode failed', err);
          const alert = await this.alertController.create({
            header: 'Invalid QR',
            message: 'Unable to decode the QR from the image.',
            buttons: ['OK']
          });
          alert.present();
        }
      };

      input.click();
    } catch (error) {
      console.error(error);
    }
  }

  ngOnInit() {
    this.isChromeExtension = this.environmentService.isChromeExtension();
  }

}
