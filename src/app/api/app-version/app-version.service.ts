import { Injectable } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import packageJson from '../../../../package.json';

@Injectable({
  providedIn: 'root',
})
export class AppVersionService {

  constructor() { }

 async getAppVersion(): Promise<string> { 
    if (Capacitor.isNativePlatform()) { 
      const info = await App.getInfo(); 
      return info.version; 
    } 
    return packageJson.version; 
  }
}
