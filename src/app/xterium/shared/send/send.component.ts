import { Component, OnInit } from '@angular/core';

import {
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonTextarea,
  IonLabel,
  IonAvatar,
  IonToast,
  ToastController,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { clipboardOutline, scanOutline } from 'ionicons/icons';

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.scss'],
  imports: [
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonInput,
    IonTextarea,
    IonLabel,
    IonAvatar,
    IonToast,
  ]
})
export class SendComponent implements OnInit {

  constructor() {
    addIcons({
      clipboardOutline,
      scanOutline
    });
  }

  ngOnInit() { }

}
