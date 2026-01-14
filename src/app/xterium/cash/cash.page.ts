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
  selector: 'app-cash',
  templateUrl: './cash.page.html',
  styleUrls: ['./cash.page.scss'],
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
export class CashPage implements OnInit {

  cashUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.cashUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.miming.net/'
    );
  }

  ngOnInit() {
  }

}
