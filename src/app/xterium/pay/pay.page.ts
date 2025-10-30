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
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCode, cloudUpload } from 'ionicons/icons';

@Component({
  selector: 'app-pay',
  templateUrl: './pay.page.html',
  styleUrls: ['./pay.page.scss'],
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
    IonCol
  ]
})
export class PayPage implements OnInit {

  constructor(private router: Router) {
    addIcons({
      qrCode,
      cloudUpload,
    });
   }

  qrCodeScannerNavigation() {
    this.router.navigate(['/qr-scanner']);
  }

   qrCodeUploadNavigation() {
    this.router.navigate(['/qr-upload']);
  }

  ngOnInit() {
  }

}
