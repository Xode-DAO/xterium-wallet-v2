import { Component, OnInit } from '@angular/core';

import {
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss'],
  imports: [
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
  ]
})
export class TokensComponent implements OnInit {

  constructor() { }

  ngOnInit() { }

}
