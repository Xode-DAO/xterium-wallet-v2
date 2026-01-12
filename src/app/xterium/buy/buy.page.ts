import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButtons,
  IonBackButton,
 } from '@ionic/angular/standalone';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-buy',
  templateUrl: './buy.page.html',
  styleUrls: ['./buy.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonButtons,
    IonBackButton,
  ]
})
export class BuyPage implements OnInit {

  buyUrl: SafeResourceUrl;
  iframeLoaded = false;

  constructor(private sanitizer: DomSanitizer) {
    this.buyUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.miming.net/'
    );
  }

  onIframeLoad() {
    this.iframeLoaded = true;
  }

  ngOnInit() {
  }

}
