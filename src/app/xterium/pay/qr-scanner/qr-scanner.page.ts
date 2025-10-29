import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';

import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.page.html',
  styleUrls: ['./qr-scanner.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
  ],
})
export class QrScannerPage implements OnInit {
  scannedResult: string | null = null;
  scanning = false;

  constructor(
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({
      arrowBackOutline,
      close,
    });
  }

  async checkPermissionAndStartScan() {
  try {
    const status = await BarcodeScanner.checkPermission({ force: true });

    if (status.granted) {
      await this.startScan();
    } else {
      await this.showAlert(
        'Permission Required',
        'Camera permission is needed to scan QR codes.'
      );
    }
  } catch (err) {
    console.error('Permission check failed', err);
    await this.showAlert(
      'Error',
      'Unable to check camera permissions. Please try again.'
    );
  }
}
  async startScan() {
    try {
      this.scanning = true;
      document.body.classList.add('scanner-active');
      await BarcodeScanner.hideBackground();
      const result = await BarcodeScanner.startScan();

      this.scanning = false;

      await BarcodeScanner.showBackground();
      document.body.classList.remove('scanner-active');

      if (result.hasContent) {
        this.scannedResult = result.content;
        await this.showAlert('QR Code Scanned', `Result: ${result.content}`);
      }
    } catch (err) {
      console.error('Scan failed', err);
      this.scanning = false;
      await BarcodeScanner.showBackground();
      document.body.classList.remove('scanner-active');
      await this.showAlert(
        'Scan Error',
        'Failed to scan QR code. Please try again.'
      );
    }
  }

  async stopScan() {
    this.scanning = false;
    await BarcodeScanner.stopScan();
    await BarcodeScanner.showBackground();
    document.body.classList.remove('scanner-active');
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async handleBack() {
  await this.stopScan();
    this.router.navigate(['/xterium/pay']);
  }

  async ngOnInit() {
    await this.checkPermissionAndStartScan();
  }
}