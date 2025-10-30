import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonTextarea,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';

import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';

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
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonTextarea,
  ],
})
export class QrScannerPage implements OnInit {
  scannedResult: string | null = null;
  scanning = false;

  constructor( private router: Router ) {
    addIcons({
      arrowBackOutline,
      close,
    });
  }

  async scanQrCode() {
    this.scanning = true;

    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
      });

      if (!result?.ScanResult) {
        this.returnToPayPage();
        return;
      }

      this.scannedResult = result.ScanResult;
      this.scanning = false;

    } catch (err) {
      console.warn('Scan cancelled or failed', err);
      this.returnToPayPage();
    }
  }

  returnToPayPage() {
    this.scanning = false;
    this.router.navigate(['/xterium/pay']);
  }

  async ngOnInit() {
    await this.scanQrCode();
  }
}