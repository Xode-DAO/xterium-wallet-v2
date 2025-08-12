import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonLabel
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, clipboardOutline, close } from 'ionicons/icons';

@Component({
  selector: 'app-import-from-backup',
  templateUrl: './import-from-backup.component.html',
  styleUrls: ['./import-from-backup.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonInput,
    IonLabel,
  ]
})
export class ImportFromBackupComponent implements OnInit {

  constructor() {
    addIcons({
      arrowBackOutline,
      clipboardOutline,
      close
    });
  }

  walletName: string = '';

  pasteFromClipboard() {

  }

  ngOnInit() { }

}
