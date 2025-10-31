import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  async encrypt(data: string, password: string): Promise<string> {
    return CryptoJS.AES.encrypt(data, password).toString();
  }

  async decrypt(encryptedData: string, password: string): Promise<string> {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
