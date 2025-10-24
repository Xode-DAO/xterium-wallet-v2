import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { StatusBar, Style } from '@capacitor/status-bar';

import { EnvironmentService } from './api/environment/environment.service';
import { BiometricService } from "src/app/api/biometric/biometric.service";
import { DeepLinkService } from './api/deep-link/deep-link.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private environmentService: EnvironmentService,
    private biometricService: BiometricService,
    private deepLinkService: DeepLinkService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      const isChromeExtension = this.environmentService.isChromeExtension();
      if (!isChromeExtension) {
        this.setupStatusBar();
      }

      this.deepLinkService.initDeepLinks();
      // this.authenticate();
    });
  }

  async setupStatusBar() {
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1B1B1B' });
    } catch (error) {
      console.error('StatusBar setup failed:', error);
    }
  }

  async authenticate() {
    try {
      const result = await this.biometricService.verifyIdentity();
      console.log('Authentication successful', result);
    } catch (error) {
      console.error('Authentication failed', error);
    }
  }
}
