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
}
