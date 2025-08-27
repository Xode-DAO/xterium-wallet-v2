import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';

import { Network } from 'src/models/network.model';
import { Wallet } from 'src/models/wallet.model';

import { OnboardingService } from "src/app/api/onboarding/onboarding.service"

import { HeaderComponent } from "src/app/onboarding/shared/header/header.component";
import { NewWalletComponent } from "src/app/onboarding/shared/new-wallet/new-wallet.component";

@Component({
  selector: 'app-create-new-wallet',
  templateUrl: './create-new-wallet.page.html',
  styleUrls: ['./create-new-wallet.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonIcon,
    HeaderComponent,
    NewWalletComponent
  ]
})
export class CreateNewWalletPage implements OnInit {

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

  onCreatedWallet(wallet: Wallet) {
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
