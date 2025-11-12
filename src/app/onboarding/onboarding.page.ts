import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonRouterOutlet } from '@ionic/angular/standalone';

import { AuthService } from 'src/app/api/auth/auth.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

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
    private router: Router,
    private authService: AuthService,
    private walletsService: WalletsService,
  ) {
    this.initAuthentication();
  }

  async initAuthentication() {
    const auth = await this.authService.getAuth();

    if (auth) {
      const isAuthExpired = auth.expires_at ? Date.now() > auth.expires_at : false;
      if (isAuthExpired) {
        await this.router.navigate(['/security'], { replaceUrl: true });
      } else {
        const wallets = await this.walletsService.getAllWallets();
        const currentWallet = await this.walletsService.getCurrentWallet();

        if (wallets.length === 0 || !currentWallet) {
          localStorage.clear();
          return;
        }

        await this.router.navigate(['/xterium'], { replaceUrl: true });
      }
    } else {
      localStorage.clear();
    }
  }

  ngOnInit() { }

}
