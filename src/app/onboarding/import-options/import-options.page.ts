import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonButtons,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';

import { HeaderComponent } from "../shared/header/header.component";
import { ImportSeedPhraseComponent } from "../shared/import-seed-phrase/import-seed-phrase.component";
import { ImportPrivateKeyComponent } from "../shared/import-private-key/import-private-key.component";
import { ImportFromBackupComponent } from "../shared/import-from-backup/import-from-backup.component";

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
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonButtons,
    IonIcon,
    IonModal,
    IonTitle,
    IonToolbar,
    HeaderComponent,
    ImportSeedPhraseComponent,
    ImportPrivateKeyComponent,
    ImportFromBackupComponent
  ]
})
export class ImportOptionsPage implements OnInit {

  constructor() {
    addIcons({
      arrowBackOutline,
      close
    });
  }

  ngOnInit() { }

}
