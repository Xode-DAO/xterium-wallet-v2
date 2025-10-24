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
    App.addListener('appUrlOpen', (event: any) => {
      this.ngZone.run(() => {
        const url = event.url;

        let slug = '';

        if (url.includes('xterium://app')) {
          slug = url.split('xterium://app').pop() || '';
        } else if (url.includes('.app')) {
          slug = url.split('.app').pop() || '';
        }

        if (slug) {
          const cleanedPath = slug.replace(/^\/+/, '');
          this.router.navigateByUrl(cleanedPath);
        }
      })
    })
  }
}
