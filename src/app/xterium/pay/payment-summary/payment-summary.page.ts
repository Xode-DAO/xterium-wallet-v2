import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonList,
  IonItem,
  IonText,
  IonCard,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';

@Component({
  selector: 'app-payment-summary',
  templateUrl: './payment-summary.page.html',
  styleUrls: ['./payment-summary.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonLabel,
    IonList,
    IonItem,
    IonText,
    IonCard,
    CommonModule,
    FormsModule,
  ],
})
export class PaymentSummaryPage implements OnInit {
  payDetails: any = {};
  formattedAmount: string = '0.00';
  wallet: any = {};
  walletAddress: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private utilService: UtilsService,
  ) {}

  truncateAddress(address: string): string {
    return this.utilService.truncateAddress(address);
  }

  pay() {
    
  }

  cancelPayment() {
    this.router.navigate(['/xterium/pay']);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['payDetails']) {
        this.payDetails = JSON.parse(params['payDetails']);
      }
      if (params['formattedAmount']) {
        this.formattedAmount = params['formattedAmount'];
      }
      if (params['wallet']) {
        this.wallet = JSON.parse(params['wallet']);
      }
      if (params['walletAddress']) {
        this.walletAddress = params['walletAddress'];
      }
    });
  }
}

