export class SettingsUserPreferences {
  hide_zero_balances: boolean = true;
}

export class Settings {
  user_preferences: SettingsUserPreferences = new SettingsUserPreferences();
}
