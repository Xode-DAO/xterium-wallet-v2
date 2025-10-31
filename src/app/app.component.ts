import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { Platform } from '@ionic/angular';
import {
  IonApp,
  IonRouterOutlet,
} from '@ionic/angular/standalone';

import { StatusBar, Style } from '@capacitor/status-bar';

import { EnvironmentService } from './api/environment/environment.service';
import { AuthService } from './api/auth/auth.service';
import { DeepLinkService } from './api/deep-link/deep-link.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [
    IonApp,
    IonRouterOutlet,
  ],
})
export class AppComponent {

  constructor(
    private platform: Platform,
    private router: Router,
    private environmentService: EnvironmentService,
    private authService: AuthService,
    private deepLinkService: DeepLinkService
  ) {
    this.initApp();
  }

  isChromeExtension = false;

  initApp() {
    this.platform.ready().then(() => {
      this.isChromeExtension = this.environmentService.isChromeExtension();

      this.initStatusBar();
      this.initAuthentication();
      this.initDeepLinks();
    });
  }

  async initStatusBar() {
    try {
      if (this.isChromeExtension) return;

      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1B1B1B' });
    } catch (error) {
      console.error('StatusBar setup failed:', error);
    }
  }

  async initAuthentication() {
    // const auth = await this.authService.getAuth();

    // if (!auth || !auth.expires_at || Date.now() > auth.expires_at) {
    //   this.router.navigate(['/security'], { replaceUrl: true });
    //   return;
    // }

    // this.router.navigate(['/xterium'], { replaceUrl: true });
  }

  initDeepLinks() {
    this.deepLinkService.initDeepLinks();
  }
}
