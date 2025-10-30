import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular/standalone';


@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
  ],
})
export class ExplorePage implements OnInit {
  showIframe = false;

  constructor(private router: Router) {}

  browserPageNavigation() {
    this.router.navigate(['/browser']);
  }

  ngOnInit() {}

}
