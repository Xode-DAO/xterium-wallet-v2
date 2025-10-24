import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { construct } from 'ionicons/icons';

@Component({
  selector: 'app-swap',
  templateUrl: './swap.page.html',
  styleUrls: ['./swap.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class SwapPage implements OnInit {

  constructor() { 
    addIcons({
      construct
    });
  }

  ngOnInit() {
  }

}
