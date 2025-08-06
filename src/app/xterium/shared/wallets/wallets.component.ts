import { Component, OnInit } from '@angular/core';

import {
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-wallets',
  templateUrl: './wallets.component.html',
  styleUrls: ['./wallets.component.scss'],
  imports: [
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
  ]
})
export class WalletsComponent implements OnInit {

  constructor() { }

  ngOnInit() { }

}
