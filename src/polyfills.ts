/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main
 *      file.
 *
 * The current setup is for so-called "evergreen" browsers; the last versions of browsers that
 * automatically update themselves. This includes recent versions of Safari, Chrome (including
 * Opera), Edge on the desktop, and iOS and Chrome on mobile.
 *
 * Learn more in https://angular.io/guide/browser-support
 */

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/**
 * By default, zone.js will patch all possible macroTask and DomEvents
 * user can disable parts of macroTask/DomEvents patch by setting following flags
 * because those flags need to be set before `zone.js` being loaded, and webpack
 * will put import in the top of bundle, so user need to create a separate file
 * in this directory (for example: zone-flags.ts), and put the following flags
 * into that file, and then add the following code before importing zone.js.
 * import './zone-flags';
 *
 * The flags allowed in zone-flags.ts are listed here.
 *
 * The following flags will work for all browsers.
 *
 * (window as any).__Zone_disable_requestAnimationFrame = true; // disable patch requestAnimationFrame
 * (window as any).__Zone_disable_on_property = true; // disable patch onProperty such as onclick
 * (window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove']; // disable patch specified eventNames
 *
 *  in IE/Edge developer tools, the addEventListener will also be wrapped by zone.js
 *  with the following flag, it will bypass `zone.js` patch for IE/Edge
 *
 *  (window as any).__Zone_enable_cross_context_check = true;
 *
 */

import './zone-flags';

/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import 'zone.js';  // Included with Angular CLI.


/***************************************************************************************************
 * APPLICATION IMPORTS
 */

document.addEventListener("DOMContentLoaded", () => {
  const styleEl = document.getElementById("deferred-style") as HTMLLinkElement;
  if (styleEl) styleEl.media = "all";

  // Detect if running as a Chrome Extension
  // This is important for applying specific styles and behaviors
  const isChromeExtension = !!(
    (window as any).chrome?.runtime?.id ||
    window.location.protocol === 'chrome-extension:'
  );

  if (isChromeExtension) {
    document.documentElement.classList.add('chrome-extension-mode');
    document.documentElement.setAttribute('data-chrome-extension', 'true');

    const width = 450;
    const height = 600;

    if (typeof window.resizeTo === 'function') window.resizeTo(width, height);

    document.documentElement.style.setProperty('--app-height', `${height}px`);
    document.documentElement.style.setProperty('--app-width', `${width}px`);
    document.documentElement.style.height = `${height}px`;
    document.documentElement.style.width = `${width}px`;
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.zoom = '0.95';

    document.body.style.height = `${height}px`;
    document.body.style.width = `${width}px`;
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.position = 'fixed';

    window.addEventListener('scroll', (e) => {
      window.scrollTo(0, 0);
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if ((e.target as HTMLElement).closest('ion-content')) return;
      e.preventDefault();
    }, { passive: false });

    const setIonAppDimensions = () => {
      const ionApp = document.querySelector('ion-app');
      if (ionApp) {
        (ionApp as HTMLElement).style.height = `${height}px`;
        (ionApp as HTMLElement).style.width = `${width}px`;
        (ionApp as HTMLElement).style.overflow = 'hidden';
      } else {
        setTimeout(setIonAppDimensions, 50);
      }
    };

    setIonAppDimensions();
  }
});
