import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { HydrationPolkadot, hydrationPolkadot } from "@polkadot-api/descriptors"
import { createClient, Transaction, TxEvent, InvalidTxError, Binary, HexString } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider';
import { sr25519 } from "@polkadot-labs/hdkd-helpers"
import { getPolkadotSigner } from "polkadot-api/signer"

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { WalletSigner } from 'src/models/wallet.model';

import { Api, PolkadotApiService } from 'src/app/api/polkadot/blockchains/polkadot-api/polkadot-api.service';

@Injectable({
  providedIn: 'root',
})
export class HydrationPolkadotService extends PolkadotApiService {
  async connect(): Promise<Api<HydrationPolkadot>> {
    const initClient = createClient(getWsProvider([
      "wss://hydration-rpc.n.dwellir.com",
      "wss://rpc.hydradx.cloud",
      "wss://rpc.helikon.io/hydradx",
      "wss://hydration.ibp.network",
      "wss://hydration.dotters.network",
    ]));

    return {
      client: initClient,
      chainApi: initClient.getTypedApi(hydrationPolkadot)
    }
  }

  async getTokens(api: Api<HydrationPolkadot>): Promise<Token[]> {
    const xodeChainSpecs = api.client.getChainSpecData();

    const xodeChainName = (await xodeChainSpecs).name;
    const xodeTokenSymbol = (await xodeChainSpecs).properties['tokenSymbol'];
    const xodeTokenDecimals = (await xodeChainSpecs).properties['tokenDecimals'];
    const xodeTotalTokenSupply = BigInt(await api.chainApi.query.Balances.TotalIssuance.getValue({ at: "best" }))

    const tokens: Token[] = [];

    const nativeToken: Token = {
      id: uuidv4(),
      reference_id: 0,
      chain_id: 2,
      name: xodeChainName,
      symbol: xodeTokenSymbol,
      decimals: xodeTokenDecimals,
      total_supply: xodeTotalTokenSupply,
      type: "native",
      image: ""
    }

    tokens.push(nativeToken);

    return tokens;
  }

  async getBalances(api: Api<HydrationPolkadot>, tokens: Token[], publicKey: string): Promise<Balance[]> {
    const balances: Balance[] = [];

    if (tokens.length > 0) {
      const assetBalances: Balance[] = [];

      await Promise.all(
        tokens.map(async (token) => {
          const balanceAccount = await api.chainApi.query.System.Account.getValue(publicKey, { at: "best" });
          balances.push({
            id: uuidv4(),
            token,
            quantity: Number(balanceAccount.data.free),
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

  watchBalances(api: Api<HydrationPolkadot>, tokens: Token[], publicKey: string): Observable<Balance[]> {
    return new Observable<Balance[]>(subscriber => {
      const subscriptions: any[] = [];
      const balances: Balance[] = [];

      (async () => {
        const balanceList = await Promise.all(
          tokens.map(async token => {
            const balanceAccount = await api.chainApi.query.System.Account.getValue(publicKey, { at: "best" });
            return <Balance>{
              id: uuidv4(),
              token,
              quantity: Number(balanceAccount.data.free),
            };
          })
        );

        const newBalances = balanceList.filter((t): t is Balance => !!t);
        balances.splice(0, balances.length, ...newBalances);
        balances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id))

        subscriber.next([...balances]);

        newBalances.forEach(balance => {
          const systemAccountSubscription = api.chainApi.query.System.Account
            .watchValue(publicKey, "best")
            .subscribe(account => {
              const idx = balances.findIndex(t => t.id === balance.id);

              if (idx >= 0) {
                balances[idx] = {
                  ...balances[idx],
                  quantity: Number(account.data.free),
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

  watchBalance(api: Api<HydrationPolkadot>, balance: Balance, publicKey: string): Observable<Balance> {
    return new Observable<Balance>(subscriber => {
      const subscriptions: any[] = [];

      const systemAccountSubscription = api.chainApi.query.System.Account
        .watchValue(publicKey, "best")
        .subscribe(account => {
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

  async transfer(api: Api<HydrationPolkadot>, balance: Balance, destPublicKey: string, value: number): Promise<HexString> {
    const bigValue = BigInt(value);

    const transferExtrinsic = api.chainApi.tx.Balances.transfer_allow_death({
      dest: destPublicKey,
      value: bigValue,
    });

    return (await transferExtrinsic.getEncodedData()).asHex()
  }

  signAndSubmitTransaction(api: Api<HydrationPolkadot>, encodedCallDataHex: HexString, walletSigner: WalletSigner): Observable<TxEvent> {
    return new Observable<TxEvent>(subscriber => {
      const subscriptions: any[] = [];

      (async () => {
        const binary = Binary.fromHex(encodedCallDataHex);
        const transaction = await api.chainApi.txFromCallData(binary);

        const secretKey = new Uint8Array(walletSigner.private_key.split(',').map(Number));
        const signer = getPolkadotSigner(
          sr25519.getPublicKey(secretKey),
          "Sr25519",
          (input) => sr25519.sign(input, secretKey),
        );

        const signTransactionSubscription = transaction
          .signSubmitAndWatch(signer)
          .subscribe({
            next: (event: TxEvent) => {
              subscriber.next(event);
            },
            error(err: InvalidTxError) {
              subscriber.error(err);
            },
          });

        subscriptions.push(signTransactionSubscription);
      })();

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }
}
