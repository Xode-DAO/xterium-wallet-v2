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
        
        let slug = '';
        
        if (url.startsWith('xterium://app')) {
          slug = url.replace('xterium://app', '');
        }

        const cleanedPath = slug.replace(/^\/+/, '');

        if (cleanedPath) {
          this.router.navigateByUrl(cleanedPath);
        }
      });
    });
  }
}
