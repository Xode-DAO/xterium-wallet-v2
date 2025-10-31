import { Injectable } from '@angular/core';

import { Preferences } from '@capacitor/preferences';
import { Auth } from "src/models/auth.model"

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_STORAGE_KEY = 'auth';

  constructor() { }

  async setupPassword(encrypted_password: string): Promise<void> {
    const auth: Auth = {
      encrypted_password: encrypted_password,
      timestamp: Date.now()
    }

    await Preferences.set({
      key: this.AUTH_STORAGE_KEY,
      value: JSON.stringify(auth)
    });
  }

  async getAuth(): Promise<Auth | null> {
    const { value } = await Preferences.get({ key: this.AUTH_STORAGE_KEY });
    return value ? JSON.parse(value) : null;
  }

  async clearAuth(): Promise<void> {
    await Preferences.remove({ key: this.AUTH_STORAGE_KEY });
  }
}
