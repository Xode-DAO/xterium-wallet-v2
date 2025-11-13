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

import { NetworkMetadata } from 'src/models/network.model';
import { Wallet } from 'src/models/wallet.model';

import { NetworkMetadataService } from 'src/app/api/network-metadata/network-metadata.service';
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
  @ViewChild('importPrivateKeyModal', { read: IonModal }) importPrivateKeyModal!: IonModal;
  @ViewChild('importFromBackupModal', { read: IonModal }) importFromBackupModal!: IonModal;

  constructor(
    private router: Router,
    private onboardingService: OnboardingService,
    private networkMetadataService: NetworkMetadataService,
  ) {
    addIcons({
      arrowBackOutline,
      close
    });
  }

  selectedNetworkMetadata: NetworkMetadata = new NetworkMetadata();

  openImportSeedPhraseModal() {
    this.importSeedPhraseModal.present();
  }

  onImportWalletSeedPhrase(wallet: Wallet) {
    this.importSeedPhraseModal.dismiss();
    this.router.navigate(['/xterium'], { replaceUrl: true });
  }

  openImportPrivateKeyModal() {
    this.importPrivateKeyModal.present();
  }

  onImportWalletPrivateKey(wallet: Wallet) {
    this.importPrivateKeyModal.dismiss();
    this.router.navigate(['/xterium'], { replaceUrl: true });
  }

  openImportFromBackupModal() {
    this.importFromBackupModal.present();
  }

  onImportWalletFromBackup(wallet: Wallet) {
    this.importFromBackupModal.dismiss();
    this.router.navigate(['/xterium'], { replaceUrl: true });
  }

  ngOnInit() {
    this.onboardingService.get().then(onboarding => {
      if (onboarding) {
        if (onboarding.step1_selected_chain) {
          const networkMetadata = this.networkMetadataService.getNetworkMetadataByNetwork(onboarding.step1_selected_chain.network);
          if (networkMetadata) {
            this.selectedNetworkMetadata = networkMetadata;
          }
        }
      }
    });
  }
}
