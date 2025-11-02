import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { IonRouterOutlet } from '@ionic/angular/standalone';

import { AuthService } from '../api/auth/auth.service';

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
  ) {
    this.initAuthentication();
  }

  async initAuthentication() {
    const auth = await this.authService.getAuth();

    if (auth) {
      const isAuthExpired = auth.expires_at ? Date.now() > auth.expires_at : false;
      if (isAuthExpired) {
        await this.router.navigate(['/security/login'], { replaceUrl: true });
      } else {
        await this.router.navigate(['/xterium/balances'], { replaceUrl: true });
      }
    } else {
      localStorage.clear();
      await this.router.navigate(['/onboarding/select-network'], { replaceUrl: true });
    }

    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.go(1);
    };
  }
}
