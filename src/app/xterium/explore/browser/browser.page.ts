import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';
import { DomSanitizer } from '@angular/platform-browser';

const URL = 'https://pusso.technokocc.fr';

@Component({
  selector: 'app-browser',
  templateUrl: './browser.page.html',
  styleUrls: ['./browser.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
  ],
})
export class BrowserPage implements OnInit {
  safeUrl: any;
  showIframe = false;

  constructor(private domSanit: DomSanitizer) {
    addIcons({
      arrowBackOutline,
      close,
    });
  }

  ngOnInit() {
    this.safeUrl = this.domSanit.bypassSecurityTrustResourceUrl(
      'https://newpage.example.com'
    );
    this.showIframe = true;
  }
}
