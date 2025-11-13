import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonLabel,
  IonIcon,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonModal,
  IonTitle,
  IonToolbar,
  IonToast,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';

import { HeaderComponent } from 'src/app/onboarding/shared/header/header.component';
import { TermsAndConditionComponent } from 'src/app/onboarding/shared/terms-and-condition/terms-and-condition.component'

import { Network, NetworkMetadata } from 'src/models/network.model';

import { ChainsService } from 'src/app/api/chains/chains.service';
import { NetworkMetadataService } from 'src/app/api/network-metadata/network-metadata.service';
import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';

@Component({
  selector: 'app-select-network',
  templateUrl: './select-network.page.html',
  styleUrls: ['./select-network.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonCard,
    IonCardContent,
    IonAvatar,
    IonLabel,
    IonIcon,
    IonButton,
    IonButtons,
    IonCheckbox,
    IonModal,
    IonTitle,
    IonToolbar,
    IonToast,
    HeaderComponent,
    TermsAndConditionComponent,
  ],
})
export class SelectNetworkPage implements OnInit {
  @ViewChild('termsAndConditionModal', { read: IonModal })
  termsAndConditionModal!: IonModal;

  constructor(
    private router: Router,
    private chainsService: ChainsService,
    private networkMetadataService: NetworkMetadataService,
    private onboardingService: OnboardingService
  ) {
    addIcons({
      close
    });
  }

  public Network = Network;

  selectedNetwork: Network = Network.Polkadot;
  selectedNetworkMetadata: NetworkMetadata | null = null;

  isAgreed: boolean = false;

  selectNetworkMetadata(network: Network) {
    this.selectedNetwork = network;

    const networkMetadata = this.networkMetadataService.getNetworkMetadataByNetwork(network);
    if (networkMetadata) {
      this.selectedNetworkMetadata = networkMetadata;
    }
  }

  async getStarted() {
    if (this.selectedNetworkMetadata) {
      const selectedChain = this.chainsService.getChainsByNetwork(this.selectedNetworkMetadata.network);

      await this.onboardingService.set({
        step1_selected_chain: selectedChain[0],
        step2_accepted_terms: this.isAgreed,
        step3_created_wallet: null,
        step4_completed: false,
      });
    }

    this.router.navigate(['/onboarding/setup-wallet']);
  }

  openTermsAndConditionModal() {
    this.termsAndConditionModal.present();
  }

  ngOnInit() { }

}
