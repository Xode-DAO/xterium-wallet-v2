import { Injectable } from '@angular/core';
import { LanguageTranslation } from 'src/models/language-translation.model';

@Injectable({
  providedIn: 'root',
})
export class LanguageTranslationService {

  private readonly languageTranslation: LanguageTranslation[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      icon: 'assets/images/flags/usa.png',
    },
    {
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      icon: 'assets/images/flags/japan.png',
    },
    {
      code: 'ko',
      name: 'Korean',
      nativeName: '한국어',
      icon: 'assets/images/flags/korea.png',
    },
    {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      icon: 'assets/images/flags/china.png',
    }
  ]

 getAllLanguage(): LanguageTranslation[] {
     return [...this.languageTranslation];
   }
}
