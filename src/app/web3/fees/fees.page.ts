import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonFooter,
  IonIcon,
  IonChip,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  checkmarkCircle, 
  closeCircle,
  arrowRedo,
  trendingUp,
  card,
  gitBranch,
  swapHorizontal,
  megaphone,
  help
} from 'ionicons/icons';
import { ExtrinsicInfo, FeeEstimate } from 'src/models/fees.model';

import { FeesService } from 'src/app/api/fees/fees.service';
import { LocalNotificationsService } from 'src/app/api/local-notifications/local-notifications.service';
import { ExtrinsicMappingService } from 'src/app/api/fees/fees-extrinsic-mapping/extrinsic-mapping.service';

@Component({
  selector: 'app-fees',
  templateUrl: './fees.page.html',
  styleUrls: ['./fees.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonItem,
    IonLabel,
    IonButton,
    IonCard,
    IonCardContent,
    IonText,
    CommonModule,
    FormsModule,
    IonGrid,
    IonRow,
    IonCol,
    IonFooter,
    IonIcon,
    IonChip,
    IonSpinner
  ],
})
export class FeesPage implements OnInit {
  extrinsic: string = '';
  extrinsicInfo: ExtrinsicInfo | null = null;
  
  transactionData: any = null;
  feeEstimate: FeeEstimate | null = null;
  isLoadingFee: boolean = true;
  feeSubscription: Subscription = new Subscription();

  transactionStatus: string = '';
  transactionHash: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private feesService: FeesService,
    private extrinsicMappingService: ExtrinsicMappingService,
    private localNotificationsService: LocalNotificationsService,
  ) {
    addIcons({ 
      checkmarkCircle, 
      closeCircle,
      arrowRedo,
      trendingUp,
      card,
      gitBranch,
      swapHorizontal,
      megaphone,
      help
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.extrinsic = params.get('extrinsic') || '';
      this.extrinsicInfo = this.extrinsicMappingService.getExtrinsicInfo(this.extrinsic);
      
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras.state) {
        const stateData = navigation.extras.state['transactionData'];
        console.log('Received transaction data:', stateData);
        
        this.transactionData = this.feesService.recreateTransaction(stateData);
        
        if (this.transactionData && this.transactionData.transaction) {
          console.log('Transaction recreated successfully, estimating fee...');
          this.estimateFee();
        } else {
          console.error('Failed to recreate transaction');
          this.isLoadingFee = false;
          this.feeEstimate = this.feesService.getFallbackFeeEstimate(
            stateData?.balance?.token?.symbol,
            stateData?.balance?.token?.decimals
          );
        }
      } else {
        console.error('No transaction data in navigation state');
        this.isLoadingFee = false;
      }
    });
  }

  private estimateFee() {
    if (!this.transactionData || !this.transactionData.transaction) {
      console.error('Transaction data or transaction object is missing');
      this.isLoadingFee = false;
      
      this.feeEstimate = this.feesService.getFallbackFeeEstimate(
        this.transactionData?.balance?.token?.symbol,
        this.transactionData?.balance?.token?.decimals
      );
      return;
    }

    this.isLoadingFee = true;

    const fromAddress = this.transactionData.wallet.formattedAddress;

    this.feeSubscription = this.feesService.estimateFee(
      this.transactionData.transaction, 
      fromAddress,
      this.transactionData.wallet.network_id
    ).subscribe({
      next: (feeEstimate: FeeEstimate) => {
        this.feeEstimate = feeEstimate;
        this.isLoadingFee = false;
      },
      error: (error) => {
        console.error('Error estimating fee:', error);
        this.isLoadingFee = false;
        this.feeEstimate = this.feesService.getFallbackFeeEstimate(
          this.transactionData.balance.token.symbol,
          this.transactionData.balance.token.decimals
        );
      }
    });
  }

  convertToNumber(value: string): number {
    return Number(value);
  }

  shouldShowField(field: string): boolean {
    return this.extrinsicInfo?.requiredFields.includes(field) || false;
  }

  getCategoryIcon(category: string): string {
    return this.extrinsicMappingService.getCategoryIcon(category as any);
  }

  getCategoryColor(category: string): string {
    return this.extrinsicMappingService.getCategoryColor(category as any);
  }

  confirmTransaction() {
    if (!this.transactionData || !this.transactionData.transaction) {
      console.error('Transaction data or transaction object is missing');
      return;
    }

    const service = this.feesService.getServiceForNetwork(this.transactionData.wallet.network_id);
    
    if (!service) return;

    console.log('Confirming transaction:', this.extrinsic);

    this.router.navigate(['/xterium/balances']);
    
    service.signTransactions(
      this.transactionData.transaction, 
      this.transactionData.wallet
    ).subscribe({
      next: async (event) => {
        this.handleTransferTransactionEvent(event);},
      error: (error) => {
        console.error('Transaction error:', error);
      }
    });
  }

  async handleTransferTransactionEvent(event: any) {
    let title = '';
    let body = '';

    const hashInfo = event.txHash ? `\nTx Hash: ${event.txHash}` : '';

    switch (event.type) {
      case "signed":
        title = "Transaction Signed";
        body = `Your transfer request has been signed and is ready to be sent.${hashInfo}`;
        break;

      case "broadcasted":
        title = "Transaction Sent";
        body = `Your transfer has been broadcasted to the network.${hashInfo}`;
        break;

      case "txBestBlocksState":
        if (event.found) {
          title = "Transaction Included in Block";

          const eventMessages = event.events.map((e: any, idx: number) => {
            if (e.type === "ExtrinsicSuccess") return `Step ${idx + 1}: Transfer succeeded.`;
            if (e.type === "ExtrinsicFailed") return `Step ${idx + 1}: Transfer failed.`;
            return `Step ${idx + 1}: ${e.type} event detected.`;
          });

          body = `Your transaction is included in a block.${hashInfo}\n` + eventMessages.join("\n");
        }
        break;

      case "finalized":
        title = "Transaction Completed";
        body = `Your transfer is now finalized and confirmed on the blockchain.${hashInfo}`;
        break;

      default:
        title = "Transaction Update";
        body = `Received event: ${event.type}${hashInfo}`;
    }

    const id = Math.floor(Math.random() * 100000);
    await this.localNotificationsService.presentNotification(title, body, id);
  }

  cancelTransaction() {
    this.router.navigate(['/xterium/balances']);
  }

  ngOnDestroy() {
    if (this.feeSubscription) {
      this.feeSubscription.unsubscribe();
    }
  }
}