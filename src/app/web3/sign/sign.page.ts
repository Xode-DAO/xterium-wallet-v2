import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-sign',
  templateUrl: './sign.page.html',
  styleUrls: ['./sign.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule]
})
export class SignPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
