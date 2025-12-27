import { Currency } from "./currency.model";
import { LanguageTranslation } from "./language-translation.model";

export class SettingsUserPreferences {
  hide_zero_balances: boolean = true;
  currency: Currency = new Currency();
  language: LanguageTranslation = new LanguageTranslation();
  developer_mode: boolean = false;
}

export class Settings {
  user_preferences: SettingsUserPreferences = new SettingsUserPreferences();
}
