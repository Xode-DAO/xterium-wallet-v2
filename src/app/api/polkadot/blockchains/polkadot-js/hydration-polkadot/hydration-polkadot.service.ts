import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { cryptoWaitReady } from '@polkadot/util-crypto';
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { hexToU8a, } from '@polkadot/util';
import { ISubmittableResult } from '@polkadot/types/types';

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
      chain_id: 2,
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

        newBalances.forEach(balance => {
          const systemAccountSubscription = api.query['system']['account'](publicKey, (data: any) => {
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

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }

  watchBalance(api: ApiPromise, balance: Balance, publicKey: string): Observable<Balance> {
    return new Observable<Balance>(subscriber => {
      const subscriptions: any[] = [];

      const systemAccountSubscription = api.query['system']['account'](publicKey, (data: any) => {
        const account = data?.toJSON() as any;
        const newBalance: Balance = {
          id: balance.id,
          token: balance.token,
          quantity: Number(account.data.free),
          price: 0,
          amount: 0,
        };

        subscriber.next(newBalance);
      });

      subscriptions.push(systemAccountSubscription);

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }

  async transfer(api: ApiPromise, balance: Balance, destPublicKey: string, value: number): Promise<string> {
    const bigIntAmount = BigInt(value);

    const transferExtrinsic = api.tx['balances']['transferAllowDeath'](
      destPublicKey,
      bigIntAmount
    );

    return transferExtrinsic.toHex();
  }

  signAndSubmitTransaction(api: ApiPromise, encodedCallDataHex: string, walletSigner: WalletSigner): Observable<ISubmittableResult> {
    return new Observable<ISubmittableResult>(subscriber => {
      const subscriptions: any[] = [];

      (async () => {
        const publicKey = new Uint8Array(walletSigner.public_key.split(',').map(Number));
        const secretKey = new Uint8Array(walletSigner.private_key.split(',').map(Number));

        const keyring = new Keyring({ type: 'sr25519' });
        const pair = keyring.addFromPair({
          publicKey,
          secretKey,
        });

        const txBytes = hexToU8a(encodedCallDataHex);
        const call = api.createType('Extrinsic', txBytes);
        const tx = api.tx(call);

        const unsub = await tx.signAndSend(pair, { nonce: -1 }, (data) => {
          subscriber.next(data);
        });

        subscriptions.push(unsub);
      })();

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }
}
