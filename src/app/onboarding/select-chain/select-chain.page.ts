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

import { Network } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';

import { ChainsService } from 'src/app/api/chains/chains.service';
import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';

@Component({
  selector: 'app-select-chain',
  templateUrl: './select-chain.page.html',
  styleUrls: ['./select-chain.page.scss'],
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
export class SelectChainPage implements OnInit {
  @ViewChild('termsAndConditionModal', { read: IonModal }) termsAndConditionModal!: IonModal;

  constructor(
    private router: Router,
    private chainsService: ChainsService,
    private onboardingService: OnboardingService
  ) {
    addIcons({
      close
    });
  }

  chains: Chain[] = [];
  selectedChain: Chain | null = null;

  isAgreed: boolean = false;

  getChains(): void {
    const polkadotChains = this.chainsService.getChainsByNetwork(Network.Polkadot);
    const paseoChains = this.chainsService.getChainsByNetwork(Network.Paseo);
    const rococoChains = this.chainsService.getChainsByNetwork(Network.Rococo);

    this.chains = [
      ...polkadotChains,
      ...paseoChains,
      ...rococoChains,
    ];
  }

  selectChain(chain: Chain) {
    this.selectedChain = chain;
  }

  async getStarted() {
    if (!this.selectedChain) {
      return;
    }

    await this.onboardingService.set({
      step1_selected_chain: this.selectedChain!,
      step2_accepted_terms: this.isAgreed,
      step3_created_wallet: null,
      step4_completed: false,
    });

    this.router.navigate(['/onboarding/setup-wallet']);
  }

  openTermsAndConditionModal() {
    this.termsAndConditionModal.present();
  }

  ngOnInit() {
    this.getChains();
    this.selectedChain = this.chains[0];
  }
}
