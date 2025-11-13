import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiPromise } from '@polkadot/api';
import { ISubmittableResult } from '@polkadot/types/types';

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { WalletSigner } from 'src/models/wallet.model';

@Injectable({
  providedIn: 'root',
})
export abstract class PolkadotJsService {
  abstract connect(): Promise<ApiPromise>;

  abstract getTokens(api: ApiPromise): Promise<Token[]>;
  abstract getBalances(api: ApiPromise, tokens: Token[], publicKey: string): Promise<Balance[]>;

  abstract watchBalances(api: ApiPromise, tokens: Token[], publicKey: string): Observable<Balance[]>;
  abstract watchBalance(api: ApiPromise, balance: Balance, publicKey: string): Observable<Balance>;

  abstract transfer(api: ApiPromise, balance: Balance, destPublicKey: string, value: number): Promise<string>;

  abstract signAndSubmitTransaction(api: ApiPromise, encodedCallDataHex: string, walletSigner: WalletSigner): Observable<ISubmittableResult>;
}
