import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PolkadotClient, TypedApi, Transaction, TxEvent } from 'polkadot-api';

import { Token, TokenPrice } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { Wallet } from 'src/models/wallet.model';
import { FeeEstimate } from 'src/models/fees.model';

@Injectable({
  providedIn: 'root'
})
export abstract class PolkadotApiService {
  protected abstract wsProvider: string;
  protected abstract client: PolkadotClient;
  protected abstract chainApi: TypedApi<any>;

  abstract getTokens(): Promise<Token[]>;
  abstract getBalances(tokens: Token[], tokenPrices: TokenPrice[], publicKey: string): Promise<Balance[]>;

  abstract watchTokens(): Observable<Token[]>;
  abstract watchBalances(tokens: Token[], tokenPrices: TokenPrice[], publicKey: string): Observable<Balance[]>;
  abstract watchBalance(balance: Balance, publicKey: string): Observable<Balance>;

  abstract transfer(balance: Balance, destPublicKey: string, value: number): Transaction<any, any, any, void | undefined>;
  abstract signTransactions(transaction: Transaction<any, any, any, void | undefined>, wallet: Wallet): Observable<TxEvent>;
  abstract estimateFee(transaction: Transaction<any, any, any, void | undefined>, publicKey: string, tokenPrices: TokenPrice[]): Observable<FeeEstimate>;
}
