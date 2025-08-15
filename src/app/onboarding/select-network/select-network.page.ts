import { Component, OnInit } from '@angular/core';
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
  IonAvatar,
  IonButton,
  IonCheckbox,
  IonToast,
} from '@ionic/angular/standalone';

import { HeaderComponent } from "../shared/header/header.component";

import { Network } from "../../../models/network.model"

import { NetworksService } from './../../api/networks/networks.service';
import { OnboardingService } from './../../api/onboarding/onboarding.service';

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
    IonAvatar,
    IonButton,
    IonCheckbox,
    IonToast,
    HeaderComponent
  ]
})
export class SelectNetworkPage implements OnInit {

  constructor(
    private router: Router,
    private networksService: NetworksService,
    private onboardingService: OnboardingService
  ) { }

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
        step4_completed: false
      });
    }

    this.router.navigate(['/onboarding/setup-wallet']);
  }

  ngOnInit() {
    const defaultNetwork = this.networksService.getNetworkById(1);
    if (defaultNetwork) {
      this.selectedNetwork = defaultNetwork;
    }
  }
}
