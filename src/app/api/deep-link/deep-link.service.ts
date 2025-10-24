import { Injectable, NgZone } from '@angular/core';
import { App } from '@capacitor/app';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class DeepLinkService {
  constructor(
    private router: Router,
    private ngZone: NgZone
  ) {}

  initDeepLinks() {
    App.addListener('appUrlOpen', (event: any) => {
      this.ngZone.run(() => {
        const url = event.url;

        // Handle both custom scheme and HTTPS
        let slug = '';

        if (url.includes('xterium://app')) {
          slug = url.split('xterium://app').pop() || ''; // custom scheme
        } else if (url.includes('.app')) {
          slug = url.split('.app').pop() || ''; // universal/app link
        }

        if (slug) {
          const cleanedPath = slug.replace(/^\/+/, '');
          this.router.navigateByUrl(cleanedPath);
        }
      })
    })
  }
}
