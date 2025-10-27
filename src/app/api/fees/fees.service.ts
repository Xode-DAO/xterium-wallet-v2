import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Transaction } from 'polkadot-api';

import { FeeEstimate } from 'src/models/fees.model';
import { TokenPrice } from 'src/models/token.model';

import { PolkadotApiService } from '../polkadot-api/polkadot-api.service';
import { AssethubPolkadotService } from '../polkadot-api/assethub-polkadot/assethub-polkadot.service';
import { XodePolkadotService } from '../polkadot-api/xode-polkadot/xode-polkadot.service';

@Injectable({
  providedIn: 'root'
})
export class FeesService {
  
  constructor(
    private assethubPolkadotService: AssethubPolkadotService,
    private xodePolkadotService: XodePolkadotService,
  ) {}

  getServiceForNetwork(networkId: number): PolkadotApiService | null {
    switch (networkId) {
      case 1: return this.assethubPolkadotService;
      case 2: return this.xodePolkadotService;
      default: return null;
    }
  }

  estimateFee(transaction: Transaction<any, any, any, void | undefined>, publicKey: string, networkId: number, tokenPrices: TokenPrice[] = []): Observable<FeeEstimate> {
    const service = this.getServiceForNetwork(networkId);
    
    if (!service) {
      throw new Error(`No service found for network ID: ${networkId}`);
    }

    return service.estimateFee(transaction, publicKey, tokenPrices);
  }

  getFallbackFeeEstimate(tokenSymbol: string = 'TOKEN', tokenDecimals: number = 12): FeeEstimate {
    return {
      fee: 'Fee unavailable',
      feeUSD: '≈ $0.00 USD',
      partialFee: BigInt(0),
      tokenSymbol: tokenSymbol,
      tokenDecimals: tokenDecimals
    };
  }

  recreateTransaction(transactionData: any): any {
    if (!transactionData) {
      console.error('No transaction data provided');
      return null;
    }

    const service = this.getServiceForNetwork(transactionData.wallet.network_id);
    if (!service) {
      console.error('No service found for network:', transactionData.wallet.network_id);
      return transactionData;
    }

    try {
      const recreatedTransaction = service.transfer(
        transactionData.transferData.balance,
        transactionData.transferData.recipientAddress,
        transactionData.transferData.amount
      );

      console.log('Transaction recreated successfully');
      
      return {
        ...transactionData,
        transaction: recreatedTransaction
      };
    } catch (error) {
      console.error('Error recreating transaction:', error);
      return transactionData;
    }
  }
}