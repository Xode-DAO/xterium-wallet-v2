import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar
} from '@ionic/angular/standalone';

import { LanguageTranslation } from 'src/models/language-translation.model';

import { LanguageTranslationService } from 'src/app/api/language-translation/language-translation.service';

@Component({
  selector: 'app-language',
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
  ]
})
export class LanguageComponent  implements OnInit {
  @Output() onSelectedLanguage = new EventEmitter<LanguageTranslation>();

  constructor(
    private languageTransalationService: LanguageTranslationService,
  ) { }

  languages: LanguageTranslation[] = [];

  getLanguages() {
    this.languages = this.languageTransalationService.getAllLanguage();
  }

  selectLanguage(language: LanguageTranslation) {
    this.onSelectedLanguage.emit(language);
  }
  
  ngOnInit() {
    this.getLanguages();
  }

}
