export class Currency {
  code: string = "";
  symbol: string = "";
}

export class SettingsUserPreferences {
  hide_zero_balances: boolean = true;
  currency: Currency = new Currency();
}

export class Settings {
  user_preferences: SettingsUserPreferences = new SettingsUserPreferences();
}
