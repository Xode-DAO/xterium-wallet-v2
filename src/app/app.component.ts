import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StatusBar, Style } from '@capacitor/status-bar';
import { LocalNotifications } from '@capacitor/local-notifications';

import { Platform } from '@ionic/angular';
import {
  IonApp,
  IonRouterOutlet,
} from '@ionic/angular/standalone';

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { DeepLinkService } from 'src/app/api/deep-link/deep-link.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonApp,
    IonRouterOutlet,
  ],
})
export class AppComponent {

  constructor(
    private platform: Platform,
    private environmentService: EnvironmentService,
    private deepLinkService: DeepLinkService,
  ) {
    this.initApp();
  }

  isChromeExtension = false;

  initApp() {
    this.platform.ready().then(async () => {
      this.isChromeExtension = this.environmentService.isChromeExtension();

      await this.initStatusBar();
      await this.initNotifications();

      this.initDeepLinks();
    });
  }

  async initStatusBar(): Promise<void> {
    try {
      if (this.isChromeExtension) return;

      await StatusBar.setBackgroundColor({ color: '#1B1B1B' });
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (_) { }
  }

  async initNotifications(): Promise<void> {
    await LocalNotifications.requestPermissions();
  }

  initDeepLinks(): void {
    this.deepLinkService.initDeepLinks();
  }
}
