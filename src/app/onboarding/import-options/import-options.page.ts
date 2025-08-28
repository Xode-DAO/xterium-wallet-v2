import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonButtons,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';

import { Network } from 'src/models/network.model';
import { Wallet } from 'src/models/wallet.model';

import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';

import { HeaderComponent } from "src/app/onboarding/shared/header/header.component";
import { ImportSeedPhraseComponent } from "src/app/onboarding/shared/import-seed-phrase/import-seed-phrase.component";
import { ImportPrivateKeyComponent } from "src/app/onboarding/shared/import-private-key/import-private-key.component";
import { ImportFromBackupComponent } from "src/app/onboarding/shared/import-from-backup/import-from-backup.component";

@Component({
  selector: 'app-import-options',
  templateUrl: './import-options.page.html',
  styleUrls: ['./import-options.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonButtons,
    IonIcon,
    IonModal,
    IonTitle,
    IonToolbar,
    HeaderComponent,
    ImportSeedPhraseComponent,
    ImportPrivateKeyComponent,
    ImportFromBackupComponent
  ]
})
export class ImportOptionsPage implements OnInit {
  @ViewChild('importSeedPhraseModal', { read: IonModal }) importSeedPhraseModal!: IonModal;

  constructor(
    private router: Router,
    private onboardingService: OnboardingService
  ) {
    addIcons({
      arrowBackOutline,
      close
    });
  }

  selectedNetwork: Network = {} as Network;

  onImportedWallet(wallet: Wallet) {
    this.router.navigate(['/xterium/balances']);
  }

  ngOnInit() {
    this.onboardingService.get().then(onboarding => {
      if (onboarding) {
        if (onboarding.step1_selected_network) {
          this.selectedNetwork = onboarding.step1_selected_network;
        }
      }
    });
  }

}
