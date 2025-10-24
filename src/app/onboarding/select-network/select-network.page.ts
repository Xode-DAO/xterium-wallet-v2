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
  IonLabel,
  IonCard,
  IonIcon,
  IonAvatar,
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

import { Network } from 'src/models/network.model';

import { NetworksService } from 'src/app/api/networks/networks.service';
import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';

import { TermsAndConditionComponent } from 'src/app/onboarding/shared/terms-and-condition/terms-and-condition.component'

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
    IonLabel,
    IonCard,
    IonIcon,
    IonAvatar,
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
    private networksService: NetworksService,
    private onboardingService: OnboardingService
  ) {
    addIcons({
      close
    });
  }

  selectedNetworkId: number = 0;
  selectedNetwork: Network | null = null;

  isAgreed: boolean = false;

  selectNetwork(id: number) {
    this.selectedNetworkId = id;

    const networkByName = this.networksService.getNetworkById(id);
    if (networkByName) {
      this.selectedNetwork = networkByName;
    }
  }

  async getStarted() {
    if (this.selectedNetwork) {
      await this.onboardingService.set({
        step1_selected_network: this.selectedNetwork,
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

  ngOnInit() {
    const defaultNetwork = this.networksService.getNetworkById(1);
    if (defaultNetwork) {
      this.selectedNetwork = defaultNetwork;
    }
  }
}
