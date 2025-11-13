import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PolkadotClient, TypedApi, Transaction, TxEvent, HexString, ChainDefinition } from 'polkadot-api';

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { WalletSigner } from 'src/models/wallet.model';

export interface Api<TChain extends ChainDefinition = ChainDefinition> {
  client: PolkadotClient;
  chainApi: TypedApi<TChain>;
}

@Injectable({
  providedIn: 'root'
})
export abstract class PolkadotApiService {
  abstract connect(): Promise<Api<ChainDefinition>>;

  abstract getTokens(api: Api<ChainDefinition>): Promise<Token[]>;
  abstract getBalances(api: Api<ChainDefinition>, tokens: Token[], publicKey: string): Promise<Balance[]>;

  abstract watchBalances(api: Api<ChainDefinition>, tokens: Token[], publicKey: string): Observable<Balance[]>;
  abstract watchBalance(api: Api<ChainDefinition>, balance: Balance, publicKey: string): Observable<Balance>;

  abstract transfer(api: Api<ChainDefinition>, balance: Balance, destPublicKey: string, value: number): Promise<HexString>;

  abstract signAndSubmitTransaction(api: Api<ChainDefinition>, encodedCallDataHex: HexString, walletSigner: WalletSigner): Observable<TxEvent>;
}
