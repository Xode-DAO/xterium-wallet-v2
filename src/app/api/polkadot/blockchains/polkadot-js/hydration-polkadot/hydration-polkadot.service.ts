import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { cryptoWaitReady } from '@polkadot/util-crypto';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult, SignerPayloadJSON, SignerPayloadRaw, SignerResult } from '@polkadot/types/types';

import { PolkadotJsService } from 'src/app/api/polkadot/blockchains/polkadot-js/polkadot-js.service';

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { WalletSigner } from 'src/models/wallet.model';

@Injectable({
  providedIn: 'root',
})
export class HydrationPolkadotService extends PolkadotJsService {
  async connect(): Promise<ApiPromise> {
    await cryptoWaitReady();

    const wsProvider = new WsProvider([
      "wss://hydration-rpc.n.dwellir.com",
      "wss://rpc.hydradx.cloud",
      "wss://rpc.helikon.io/hydradx",
      "wss://hydration.ibp.network",
      "wss://hydration.dotters.network",
    ]);
    const api = await ApiPromise.create({ provider: wsProvider });

    return api;
  }

  async getTokens(api: ApiPromise): Promise<Token[]> {
    const tokens: Token[] = [];

    const systemChain = await api.rpc.system.chain();
    const systemProperties = (await api.rpc.system.properties()).toHuman();
    const balanceTotalIssuance = (await api.query['balances']['totalIssuance']()).toString();

    const xodeChainName = systemChain.toString();
    const xodeTokenSymbol = systemProperties['tokenSymbol'];
    const xodeTokenDecimals = systemProperties['tokenDecimals'];
    const xodeTotalTokenSupply = balanceTotalIssuance;

    const nativeToken: Token = {
      id: uuidv4(),
      reference_id: 0,
      chain_id: 5,
      name: xodeChainName,
      symbol: xodeTokenSymbol?.toString() ?? "",
      decimals: xodeTokenDecimals !== undefined ? Number(xodeTokenDecimals) : 0,
      total_supply: xodeTotalTokenSupply !== undefined ? BigInt(balanceTotalIssuance) : BigInt(0),
      type: "native",
      image: ""
    };

    tokens.push(nativeToken);

    return tokens;
  }

  async getExistentialDepositOfNativeToken(api: ApiPromise): Promise<number> {
    const existentialDeposit = api.consts['balances']['existentialDeposit'];
    return Number(existentialDeposit.toString());
  };

  async getMinimumBalanceOfAssetToken(api: ApiPromise, reference_id: number): Promise<number | null> {
    return null;
  };

  async getBalances(api: ApiPromise, tokens: Token[], publicKey: string): Promise<Balance[]> {
    const balances: Balance[] = [];

    if (tokens.length > 0) {
      const assetBalances: Balance[] = [];

      await Promise.all(
        tokens.map(async (token) => {
          const systemAccount = await api.query['system']['account'](publicKey);
          const account = systemAccount.toJSON() as any;

          balances.push({
            id: uuidv4(),
            token,
            quantity: Number(account.data.free),
            price: 0,
            amount: 0,
          });
        })
      );

      assetBalances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id));
      balances.push(...assetBalances);
    }

    return balances;
  }

  watchBalances(api: ApiPromise, tokens: Token[], publicKey: string): Observable<Balance[]> {
    return new Observable<Balance[]>(subscriber => {
      const subscriptions: any[] = [];
      const balances: Balance[] = [];

      (async () => {
        const balanceList = await Promise.all(
          tokens.map(async token => {
            const systemAccount = await api.query['system']['account'](publicKey);
            const account = systemAccount?.toJSON() as any;

            return <Balance>{
              id: uuidv4(),
              token,
              quantity: Number(account.data.free),
              price: 0,
              amount: 0,
            };
          })
        );

        const newBalances = balanceList.filter((t): t is Balance => !!t);
        balances.splice(0, balances.length, ...newBalances);
        balances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id))

        subscriber.next([...balances]);

        newBalances.forEach(async balance => {
          const systemAccountSubscription = await api.query['system']['account'](publicKey, (data: any) => {
            const account = data?.toJSON() as any;
            const idx = balances.findIndex(t => t.id === balance.id);

            if (idx >= 0) {
              balances[idx] = {
                ...balances[idx],
                quantity: Number(account.data.free),
                price: 0,
                amount: 0,
              };

              subscriber.next([...balances]);
            }
          });

          subscriptions.push(systemAccountSubscription);
        });
      })();

      return () => subscriptions.forEach(unsub => unsub());
    });
  }

  async getBalance(api: ApiPromise, token: Token, publicKey: string): Promise<Balance> {
    const systemAccount = await api.query['system']['account'](publicKey);
    const account = systemAccount.toJSON() as any;

    const balance: Balance = {
      id: uuidv4(),
      token,
      quantity: Number(account.data.free),
      price: 0,
      amount: 0,
    };

    return balance;
  }

  watchBalance(api: ApiPromise, token: Token, publicKey: string): Observable<Balance> {
    return new Observable<Balance>(subscriber => {
      const subscriptions: any[] = [];

      (async () => {
        const systemAccountSubscription = await api.query['system']['account'](publicKey, (data: any) => {
          const account = data?.toJSON() as any;
          const newBalance: Balance = {
            id: uuidv4(),
            token,
            quantity: Number(account.data.free),
            price: 0,
            amount: 0,
          };

          subscriber.next(newBalance);
        });

        subscriptions.push(systemAccountSubscription);
      })();

      return () => subscriptions.forEach(unsub => unsub());
    });
  }

  transfer(api: ApiPromise, balance: Balance, destPublicKey: string, value: number): SubmittableExtrinsic<"promise", ISubmittableResult> {
    const bigIntAmount = BigInt(value);

    const transferExtrinsic = api.tx['balances']['transferKeepAlive'](
      destPublicKey,
      bigIntAmount
    );

    return transferExtrinsic;
  }

  async getEstimatedFees(api: ApiPromise, extrinsicHex: string, publicKey: string, token: Token | null): Promise<number> {
    const txBytes = hexToU8a(extrinsicHex);
    const call = api.createType('Extrinsic', txBytes);
    const tx = api.tx(call);

    const { partialFee } = await tx.paymentInfo(publicKey);

    return Number(BigInt(partialFee.toString()));
  }

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
