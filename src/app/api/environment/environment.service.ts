import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  isChromeExtension(): boolean {
    const isChromeExtension = !!(
      (window as any).chrome?.runtime?.id ||
      window.location.protocol === 'chrome-extension:' ||
      document.documentElement.hasAttribute('data-chrome-extension')
    );

    return isChromeExtension;
  }
}
