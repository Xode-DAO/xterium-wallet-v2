import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pay',
  templateUrl: './pay.page.html',
  styleUrls: ['./pay.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PayPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
