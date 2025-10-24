import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonRouterOutlet } from '@ionic/angular/standalone';

import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';
import { SyncWalletsService } from '../api/sync-wallets/sync-wallets.service';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  imports: [IonRouterOutlet, CommonModule, FormsModule],
})
export class OnboardingPage implements OnInit {
  constructor(
    private router: Router,
    private onboardingService: OnboardingService,
    private syncWalletsService: SyncWalletsService
  ) { }

  ngOnInit() {
    this.syncWalletsService.syncWallets();

    this.onboardingService.get().then((onboarding) => {
      if (onboarding) {
        if (
          onboarding.step1_selected_network !== null &&
          onboarding.step2_accepted_terms !== false &&
          onboarding.step3_created_wallet !== null &&
          onboarding.step4_completed === true
        ) {
          this.router.navigate(['/xterium']);
        }
      }
    });
  }
}
