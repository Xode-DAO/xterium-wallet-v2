import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { App } from '@capacitor/app';

import {
  IonContent,
  IonFooter,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonCheckbox,
  IonToast,
} from '@ionic/angular/standalone';

// import { Network } from 'src/models/network.model';
// import { Chain } from 'src/models/chain.model';
// import { Wallet } from 'src/models/wallet.model'

// import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
// import { ChainsService } from 'src/app/api/chains/chains.service';
// import { WalletsService } from 'src/app/api/wallets/wallets.service';
// import { EnvironmentService } from 'src/app/api/environment/environment.service';
// import { SettingsService } from 'src/app/api/settings/settings.service';

@Component({
  selector: 'app-connected-accounts',
  templateUrl: './connected-accounts.page.html',
  styleUrls: ['./connected-accounts.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonFooter,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonCheckbox,
    IonToast
  ]
})
export class ConnectedAccountsPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
