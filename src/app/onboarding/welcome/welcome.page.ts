import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
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
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
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
