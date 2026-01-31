import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { hexToU8a } from '@polkadot/util';
import { ApiPromise, Keyring } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult, SignerPayloadJSON, SignerPayloadRaw, SignerResult } from '@polkadot/types/types';
import { HexString } from '@polkadot/util/types';

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

  sign(api: ApiPromise, payload: SignerPayloadJSON | SignerPayloadRaw, walletSigner: WalletSigner): SignerResult {
    const publicKey = new Uint8Array(walletSigner.public_key.split(',').map(Number));
    const secretKey = new Uint8Array(walletSigner.private_key.split(',').map(Number));

    const keyring = new Keyring({ type: 'sr25519' });
    const pair = keyring.addFromPair({ publicKey, secretKey });

    if ('withSignedTransaction' in payload) {
      const method = api.registry.createType('Call', payload.method);
      const extrinsic = api.registry.createType('Extrinsic', { method }, { version: payload.version });

      const extrinsicPayload = api.registry.createType('ExtrinsicPayload', payload, {
        version: payload.version
      });

      const { signature } = extrinsicPayload.sign(pair);

      extrinsic.addSignature(
        payload.address,
        signature,
        {
          blockHash: payload.blockHash,
          era: payload.era,
          genesisHash: payload.genesisHash,
          method: payload.method,
          nonce: payload.nonce,
          specVersion: payload.specVersion,
          tip: payload.tip,
          transactionVersion: payload.transactionVersion,
          assetId: payload.assetId,
          mode: payload.mode,
          metadataHash: payload.metadataHash,
        }
      );

      const signedTx = extrinsic.toHex();

      return {
        id: 1,
        signature: signature,
        signedTransaction: payload.withSignedTransaction ? signedTx : undefined,
      };
    } else {
      const extrinsicPayload = api.registry.createType('ExtrinsicPayload', payload);
      const { signature } = extrinsicPayload.sign(pair);

      return {
        id: 1,
        signature: signature,
      };
    }
  }

  async signAsync(api: ApiPromise, transactionHex: HexString, walletSigner: WalletSigner): Promise<SignerResult> {
    const publicKey = new Uint8Array(walletSigner.public_key.split(',').map(Number));
    const secretKey = new Uint8Array(walletSigner.private_key.split(',').map(Number));

    const keyring = new Keyring({ type: 'sr25519' });
    const pair = keyring.addFromPair({ publicKey, secretKey });

    const txBytes = hexToU8a(transactionHex);
    const call = api.createType('Extrinsic', txBytes);
    const tx = api.tx(call);

    const signedTx = await tx.signAsync(pair, { nonce: -1 });

    return {
      id: 1,
      signature: signedTx.signature.toHex(),
      signedTransaction: signedTx.toHex(),
    };
  }

  signAndSend(api: ApiPromise, transactionHex: string, walletSigner: WalletSigner): Observable<ISubmittableResult> {
    return new Observable<ISubmittableResult>(subscriber => {
      const subscriptions: any[] = [];

      (async () => {
        try {
          const publicKey = new Uint8Array(walletSigner.public_key.split(',').map(Number));
          const secretKey = new Uint8Array(walletSigner.private_key.split(',').map(Number));

          const keyring = new Keyring({ type: 'sr25519' });
          const pair = keyring.addFromPair({ publicKey, secretKey });

          const extrinsic = api.registry.createType('Extrinsic', transactionHex);

          const tx = await api.tx(extrinsic).signAsync(pair);
          const unsubscribe = await tx.send((result: ISubmittableResult) => {
            subscriber.next(result);

            if (result.status.isInvalid || result.isError) {
              console.error('Transaction error');
              subscriber.error(new Error('Transaction failed'));
              return;
            }

            if (result.status.isInBlock || result.status.isFinalized) {
              const dispatchError = result.dispatchError;

              if (dispatchError) {
                let errorMessage = 'Transaction failed';

                if (dispatchError.isModule) {
                  const decoded = api.registry.findMetaError(dispatchError.asModule);
                  errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                } else {
                  errorMessage = dispatchError.toString();
                }

                console.error('Dispatch error:', errorMessage);
                subscriber.error(new Error(errorMessage));
                return;
              }
            }

            if (result.status.isFinalized) {
              subscriber.complete();
            }
          });

          subscriptions.push(unsubscribe);
        } catch (error) {
          console.error('Error in send:', error);
          subscriber.error(error);
        }
      })();

      return () => {
        subscriptions.forEach(unsub => unsub());
      };
    });
  }
}
