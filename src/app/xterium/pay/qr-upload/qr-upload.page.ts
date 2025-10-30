import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
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

import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import { BrowserQRCodeReader } from '@zxing/browser';

@Component({
  selector: 'app-qr-upload',
  templateUrl: './qr-upload.page.html',
  styleUrls: ['./qr-upload.page.scss'],
  standalone: true,
  imports: [
    RouterModule, 
    CommonModule, 
    FormsModule, 
    IonContent, 
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
export class QrUploadPage implements OnInit {
  scannedResult: string | null = null;
  isUploading = false;

  constructor() {
    addIcons({
      arrowBackOutline,
      close,
    });
  }

  async uploadQr() {
    try {
      this.isUploading = true;
      const photo = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.DataUrl,
      });

      const qrReader = new BrowserQRCodeReader();
      const result = await qrReader.decodeFromImageUrl(photo.dataUrl);

      this.scannedResult = result.getText();
    } catch (error) {
      console.error('QR decode error:', error);
      this.scannedResult = 'Invalid or unreadable QR image';
    } finally {
      this.isUploading = false;
    }
  }

  async ngOnInit() {
    await this.uploadQr();
  }
}
