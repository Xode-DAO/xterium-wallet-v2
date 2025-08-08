import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { StatusBar, Style } from '@capacitor/status-bar';

import { BiometricService } from "./api/biometric/biometric.service";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private biometricService: BiometricService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.setupStatusBar();
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
