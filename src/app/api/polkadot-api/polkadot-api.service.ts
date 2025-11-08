import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PolkadotClient, TypedApi, Transaction, TxEvent, HexString } from 'polkadot-api';

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { WalletSigner } from 'src/models/wallet.model';

@Injectable({
  providedIn: 'root'
})
export abstract class PolkadotApiService {
  protected abstract wsProvider: string;
  protected abstract client: PolkadotClient;
  protected abstract chainApi: TypedApi<any>;

  abstract getTokens(): Promise<Token[]>;
  abstract getBalances(tokens: Token[], publicKey: string): Promise<Balance[]>;

  abstract watchTokens(): Observable<Token[]>;
  abstract watchBalances(tokens: Token[], publicKey: string): Observable<Balance[]>;
  abstract watchBalance(balance: Balance, publicKey: string): Observable<Balance>;

  abstract transfer(balance: Balance, destPublicKey: string, value: number): Transaction<any, any, any, void | undefined>

  abstract decodeCallData(encodedCallDataHex: HexString): Promise<Transaction<any, any, any, void | undefined>>;
  abstract signAndSubmitTransaction(encodedCallDataHex: HexString, walletSigner: WalletSigner): Observable<TxEvent>;
}
