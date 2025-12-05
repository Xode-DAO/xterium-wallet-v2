import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class DeepLinkService {
  constructor(
    private router: Router,
    private ngZone: NgZone
  ) { }

  initDeepLinks() {
    App.addListener('appUrlOpen', (event) => {
      this.ngZone.run(() => {
        const url = event.url || '';
        if (!url.startsWith('xterium://app')) return;
  
        let path = url.replace('xterium://app', '');
  
        if (!path.startsWith('/')) {
          path = '/' + path;
        }

        this.router.navigateByUrl(path);
      });
    });
  }

  sendDeeplink(deeplink: string, callbackUrl?: string, encodedWallets?: any[]) {
    if (Capacitor.isNativePlatform()) {
      if (callbackUrl) {
        const finalUrl =
          `${callbackUrl}?wallets=${encodeURIComponent(JSON.stringify(encodedWallets))}`;

        window.location.href = finalUrl;
        App.exitApp();
        return;
      }

      window.location.href = deeplink;
      return;
    }

    window.location.href = deeplink;
  }
}
