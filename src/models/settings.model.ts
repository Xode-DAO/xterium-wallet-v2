import { Currency } from "./currency.model";

export class SettingsUserPreferences {
  hide_zero_balances: boolean = true;
  currency: Currency = new Currency();
}

export class Settings {
  user_preferences: SettingsUserPreferences = new SettingsUserPreferences();
}