import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';

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
  ]
})
export class QrUploadPage implements OnInit {

  constructor() {
    addIcons({
      arrowBackOutline,
      close,
    });
   }

  ngOnInit() {
  }

}
