import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult, SignerPayloadJSON, SignerPayloadRaw, SignerResult } from '@polkadot/types/types';

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { WalletSigner } from 'src/models/wallet.model';

@Injectable({
  providedIn: 'root',
})
export abstract class PolkadotJsService {
  abstract connect(): Promise<ApiPromise>;

  abstract getTokens(api: ApiPromise): Promise<Token[]>;
  abstract getExistentialDepositOfNativeToken(api: ApiPromise): Promise<number>;
  abstract getMinimumBalanceOfAssetToken(api: ApiPromise, reference_id: number): Promise<number | null>;

  abstract getBalances(api: ApiPromise, tokens: Token[], publicKey: string): Promise<Balance[]>;
  abstract watchBalances(api: ApiPromise, tokens: Token[], publicKey: string): Observable<Balance[]>;

  abstract getBalance(api: ApiPromise, token: Token, publicKey: string): Promise<Balance>;
  abstract watchBalance(api: ApiPromise, token: Token, publicKey: string): Observable<Balance>;

  abstract transfer(api: ApiPromise, balance: Balance, destPublicKey: string, value: number): SubmittableExtrinsic<"promise", ISubmittableResult>;

  abstract getEstimatedFees(api: ApiPromise, extrinsicHex: string, publicKey: string, token: Token | null): Promise<number>;

  abstract sign(api: ApiPromise, payload: SignerPayloadJSON | SignerPayloadRaw, walletSigner: WalletSigner): SignerResult;
  abstract signAndSend(api: ApiPromise, transactionHex: string, walletSigner: WalletSigner): Observable<ISubmittableResult>;
}
