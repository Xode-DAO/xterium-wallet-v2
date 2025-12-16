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
    },
    {
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
    },
    {
      code: 'ko',
      name: 'Korean',
      nativeName: '한국어',
    },
    {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
    }
  ]

 getAllLanguage(): LanguageTranslation[] {
     return [...this.languageTranslation];
   }
}
