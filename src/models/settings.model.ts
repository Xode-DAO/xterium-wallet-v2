export class SettingsUserPreferences {
  hide_zero_balances: boolean = true;
  currency_code: string = "";
  currency_symbol: string = "";
}

export class Settings {
  user_preferences: SettingsUserPreferences = new SettingsUserPreferences();
}
