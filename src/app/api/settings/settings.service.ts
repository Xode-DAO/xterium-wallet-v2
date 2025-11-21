import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { Preferences } from '@capacitor/preferences';
import { Settings } from "src/models/settings.model"

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly SETTINGS_STORAGE_KEY = 'settings';

  private currentSettingsSubject = new BehaviorSubject<Settings | undefined>(undefined);
  public currentSettingsObservable = this.currentSettingsSubject.asObservable();

  constructor() { }

  async set(settings: Settings): Promise<void> {
    await Preferences.set({
      key: this.SETTINGS_STORAGE_KEY,
      value: JSON.stringify(settings)
    });

    this.currentSettingsSubject.next(settings);
  }

  async get(): Promise<Settings | undefined> {
    const { value } = await Preferences.get({ key: this.SETTINGS_STORAGE_KEY });
    return value ? JSON.parse(value) : undefined;
  }
}
