import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PolkadotClient, TypedApi } from 'polkadot-api';

import { Token, TokenPrices } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';

@Injectable({
  providedIn: 'root'
})
export abstract class PolkadotApiService {
  protected abstract wsProvider: string;
  protected abstract client: PolkadotClient;
  protected abstract chainApi: TypedApi<any>;

  abstract getTokens(): Promise<Token[]>;
  abstract getBalances(tokens: Token[], tokenPrices: TokenPrices[], publicKey: string): Promise<Balance[]>;

  abstract watchTokens(): Observable<Token[]>;
  abstract watchBalances(tokens: Token[], tokenPrices: TokenPrices[], publicKey: string): Observable<Balance[]>;
  abstract watchBalance(balance: Balance, publicKey: string): Observable<Balance>;

}
