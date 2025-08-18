import { Injectable } from '@angular/core';

import { Preferences } from '@capacitor/preferences';
import { Onboarding } from "src/models/onboarding.model"

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly ONBOARDING_STORAGE_KEY = 'onboarding';

  constructor() { }

  async get(): Promise<Onboarding | undefined> {
    const { value } = await Preferences.get({ key: this.ONBOARDING_STORAGE_KEY });
    return value ? JSON.parse(value) : undefined;
  }

  async set(data: Onboarding): Promise<void> {
    await Preferences.set({
      key: this.ONBOARDING_STORAGE_KEY,
      value: JSON.stringify(data)
    });
  }

  async update(data: Partial<Onboarding>): Promise<void> {
    const currentData = await this.get();
    if (currentData) {
      const updatedData = { ...currentData, ...data };

      await Preferences.set({
        key: this.ONBOARDING_STORAGE_KEY,
        value: JSON.stringify(updatedData)
      });
    }
  }
}
