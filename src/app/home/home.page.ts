import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { IonRouterOutlet } from '@ionic/angular/standalone';

import { AuthService } from 'src/app/api/auth/auth.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonRouterOutlet],
})
export class HomePage {

  constructor(
    private router: Router,
    private authService: AuthService,
    private walletsService: WalletsService
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

          await this.router.navigate(['/onboarding'], { replaceUrl: true });
          return;
        }

        await this.router.navigate(['/xterium'], { replaceUrl: true });
      }
    } else {
      localStorage.clear();
      await this.router.navigate(['/onboarding'], { replaceUrl: true });
    }
  }
}
