import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonTextarea,
  IonLabel
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, clipboardOutline, close } from 'ionicons/icons';

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
    IonModal,
    IonTitle,
    IonToolbar,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonInput,
    IonTextarea,
    IonLabel,
    HeaderComponent
  ]
})
export class ImportOptionsPage implements OnInit {

  constructor() {
    addIcons({
      arrowBackOutline,
      clipboardOutline,
      close
    });
  }

  presentingElement!: HTMLElement | null;

  mnemonicName: string = '';
  mnemonicWords: string[] = new Array(12).fill('Sample');
  privateKeyInput: string = '';

  pasteFromClipboard() {

  }

  ngOnInit() {
    this.presentingElement = document.querySelector('.onboarding-content');
  }

}
