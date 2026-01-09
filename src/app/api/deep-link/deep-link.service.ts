import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { App } from '@capacitor/app';

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
        const matchDomain = 'deeplink.xterium.app';
        let path = '';

        try {
          const parsed = new URL(url);
          if (parsed.hostname !== matchDomain) return;
          path = parsed.pathname + parsed.search + parsed.hash;
        } catch {
          return;
        }

        if (!path.startsWith('/')) {
          path = '/' + path;
        }

        this.router.navigateByUrl(path);
      });
    });
  }
}
