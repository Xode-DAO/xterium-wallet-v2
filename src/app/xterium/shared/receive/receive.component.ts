import { Component, OnInit } from '@angular/core';

import {
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton
} from '@ionic/angular/standalone';

import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-receive',
  templateUrl: './receive.component.html',
  styleUrls: ['./receive.component.scss'],
  imports: [
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonButton,
    QRCodeComponent
  ]
})
export class ReceiveComponent implements OnInit {

  constructor() { }

  ngOnInit() { }

}
