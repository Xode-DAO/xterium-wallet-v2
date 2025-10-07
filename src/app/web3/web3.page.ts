import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-web3',
  templateUrl: './web3.page.html',
  styleUrls: ['./web3.page.scss'],
  standalone: true,
  imports: [IonRouterOutlet, CommonModule, FormsModule]
})
export class Web3Page implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
