import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonRouterOutlet } from '@ionic/angular/standalone';

import { SyncWalletsService } from 'src/app/api/sync-wallets/sync-wallets.service';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonRouterOutlet
  ],
})
export class OnboardingPage implements OnInit {

  constructor(
    private syncWalletsService: SyncWalletsService
  ) { }

  ngOnInit() {
    this.syncWalletsService.syncWallets();
  }
}
