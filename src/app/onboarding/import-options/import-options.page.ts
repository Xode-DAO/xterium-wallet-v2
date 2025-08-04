import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';

import { HeaderComponent } from "../shared/header/header.component";

@Component({
  selector: 'app-import-options',
  templateUrl: './import-options.page.html',
  styleUrls: ['./import-options.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonHeader,
    IonModal,
    IonTitle,
    IonToolbar,
    HeaderComponent
  ]
})
export class ImportOptionsPage implements OnInit {

  constructor() {
    addIcons({
      arrowBackOutline,
      close
    });
  }

  presentingElement!: HTMLElement | null;

  ngOnInit() {
    this.presentingElement = document.querySelector('.onboarding-content');
  }

}
