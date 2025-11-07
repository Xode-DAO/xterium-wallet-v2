import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Preferences } from '@capacitor/preferences';
import { Auth } from "src/models/auth.model"

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_STORAGE_KEY = 'auth';
  private readonly AUTH_EXPIRES_IN_MS = 5 * 60 * 1000;

  constructor(private router: Router,) { }

  async setupPassword(encrypted_password: string): Promise<void> {
    const auth: Auth = {
      encrypted_password: encrypted_password,
      expires_at: Date.now() + this.AUTH_EXPIRES_IN_MS
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

  async renewAuth(): Promise<void> {
    const auth = await this.getAuth();
    if (!auth) return;

    auth.expires_at = Date.now() + this.AUTH_EXPIRES_IN_MS;

    await Preferences.set({
      key: this.AUTH_STORAGE_KEY,
      value: JSON.stringify(auth)
    });
  }

  async clearAuth(): Promise<void> {
    await Preferences.remove({ key: this.AUTH_STORAGE_KEY });
  }

  async logout(): Promise<void> {
    const auth = await this.getAuth();
    if (!auth) return;

    auth.expires_at = Date.now();

    await Preferences.set({
      key: this.AUTH_STORAGE_KEY,
      value: JSON.stringify(auth)
    });

    await this.router.navigate(['/security'], { replaceUrl: true });
  }
}
