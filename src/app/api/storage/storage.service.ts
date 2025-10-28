import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor() {}

  async set(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      throw new Error(`Failed to store data for key: ${key}`);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const result = await Preferences.get({ key });

      return result.value;
    } catch (error) {
      throw new Error(`Failed to retrieve data for key: ${key}`);
    }
  }
}
