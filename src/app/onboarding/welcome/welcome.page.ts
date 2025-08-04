import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCheckbox,
  IonButton
} from '@ionic/angular/standalone';

import { HeaderComponent } from "../shared/header/header.component";

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCheckbox,
    IonButton,
    HeaderComponent
]
})
export class WelcomePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
