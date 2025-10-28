import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { BiometricService } from '../biometric/biometric.service';
import { StorageService } from '../storage/storage.service';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  constructor(
    private biometricService: BiometricService,
    private storageService: StorageService,
    private platform: Platform
  ) {}

  private isMobile(): boolean {
    return (
      this.platform.is('mobile') ||
      this.platform.is('android') ||
      this.platform.is('ios') ||
      this.platform.is('capacitor')
    );
  }

  async encryptData(data: string, password?: string): Promise<string> {
    const key = await this.getEncryptionKey(password);
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  async decryptData(encryptedData: string, password?: string): Promise<string> {
    const key = await this.getEncryptionKey(password);
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private async getEncryptionKey(password?: string): Promise<string> {
    if (this.isMobile()) {
      const { password: bioKey } = await this.biometricService.getCredentials();
      if (!bioKey) throw new Error('No biometric key available.');
      return bioKey;
    } else {
      if (!password) {
        const storedPassword = await this.storageService.get('extensionPassword');
        if (!storedPassword) throw new Error('Password not found. Please set up first.');
        return storedPassword;
      }
      return password;
    }
  }
}
