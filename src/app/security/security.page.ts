import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-security',
  templateUrl: './security.page.html',
  styleUrls: ['./security.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonRouterOutlet,
  ]
})
export class SecurityPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
