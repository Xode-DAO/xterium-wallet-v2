import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonButton,
  IonIcon,
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
  selector: 'app-import-seed-phrase',
  templateUrl: './import-seed-phrase.component.html',
  styleUrls: ['./import-seed-phrase.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonInput,
    IonLabel,
  ]
})
export class ImportSeedPhraseComponent implements OnInit {

  constructor() {
    addIcons({
      arrowBackOutline,
      clipboardOutline,
      close
    });
  }

  walletName: string = '';
  mnemonicPhrase: string[] = new Array(12).fill('Sample');

  pasteFromClipboard() {

  }

  ngOnInit() { }

}
