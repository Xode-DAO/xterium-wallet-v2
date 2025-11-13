import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { XodePolkadot, xodePolkadot, MultiAddress } from "@polkadot-api/descriptors"
import { createClient, Transaction, TxEvent, InvalidTxError, Binary, HexString } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider';
import { sr25519 } from "@polkadot-labs/hdkd-helpers"
import { getPolkadotSigner } from "polkadot-api/signer"

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { WalletSigner } from 'src/models/wallet.model';

import { Api, PolkadotApiService } from 'src/app/api/polkadot/blockchains/polkadot-api/polkadot-api.service';

@Injectable({
  providedIn: 'root'
})
export class XodePolkadotService extends PolkadotApiService {
  async connect(): Promise<Api<XodePolkadot>> {
    const initClient = createClient(getWsProvider([
      "wss://light-node.xode.net/xode-polkadot",
      "wss://xode-polkadot-rpc-01.zeeve.net/y0yxg038wn1fncc/rpc",
      "wss://polkadot-rpcnode.xode.net",
    ]));

    return {
      client: initClient,
      chainApi: initClient.getTypedApi(xodePolkadot)
    }
  }

  async getTokens(api: Api<XodePolkadot>): Promise<Token[]> {
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

    const assets = await api.chainApi.query.Assets.Asset.getEntries({ at: "best" });
    await Promise.all(
      assets.map(async (asset) => {
        const assetId = asset.keyArgs[0];
        if (!assetId) return;

        const metadata = await api.chainApi.query.Assets.Metadata.getValue(assetId, { at: "best" });
        const assetToken: Token = {
          id: uuidv4(),
          reference_id: assetId,
          chain_id: 2,
          name: metadata.name.asText(),
          symbol: metadata.symbol.asText(),
          decimals: metadata.decimals,
          total_supply: BigInt(asset.value.supply),
          type: "asset",
          image: ""
        };

        tokens.push(assetToken);
      })
    );

    return tokens;
  }

  async getBalances(api: Api<XodePolkadot>, tokens: Token[], publicKey: string): Promise<Balance[]> {
    const balances: Balance[] = [];

    if (tokens.length > 0) {
      const assetBalances: Balance[] = [];

      await Promise.all(
        tokens.map(async (token) => {
          if (token.type === 'native') {
            const balanceAccount = await api.chainApi.query.System.Account.getValue(publicKey, { at: "best" });
            balances.push({
              id: uuidv4(),
              token,
              quantity: Number(balanceAccount.data.free),
              price: 0,
              amount: 0,
            });
          } else {
            const assetId = token.reference_id;
            const account = await api.chainApi.query.Assets.Account.getValue(Number(assetId), publicKey, { at: "best" });
            const metadata = await api.chainApi.query.Assets.Metadata.getValue(Number(assetId), { at: "best" });

            if (account && metadata) {
              assetBalances.push({
                id: uuidv4(),
                token,
                quantity: Number(account.balance),
                price: 0,
                amount: 0,
              });
            }
          }
        })
      );

      assetBalances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id));
      balances.push(...assetBalances);
    }

    return balances;
  }

  watchBalances(api: Api<XodePolkadot>, tokens: Token[], publicKey: string): Observable<Balance[]> {
    return new Observable<Balance[]>(subscriber => {
      const subscriptions: any[] = [];
      const balances: Balance[] = [];

      (async () => {
        const balanceList = await Promise.all(
          tokens.map(async token => {
            if (token.type === 'native') {
              const balanceAccount = await api.chainApi.query.System.Account.getValue(publicKey, { at: "best" });
              return <Balance>{
                id: uuidv4(),
                token,
                quantity: Number(balanceAccount.data.free),
                price: 0,
                amount: 0,
              };
            } else {
              const assetId = token.reference_id;

              const account = await api.chainApi.query.Assets.Account.getValue(Number(assetId), publicKey, { at: "best" });
              if (!account) return null;

              return <Balance>{
                id: uuidv4(),
                token,
                quantity: Number(account.balance),
                price: 0,
                amount: 0,
              };
            }
          })
        );

        const newBalances = balanceList.filter((t): t is Balance => !!t);
        balances.splice(0, balances.length, ...newBalances);
        balances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id))

        subscriber.next([...balances]);

        newBalances.forEach(balance => {
          if (balance.token.type === 'native') {
            const systemAccountSubscription = api.chainApi.query.System.Account
              .watchValue(publicKey, "best")
              .subscribe(account => {
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
          } else {
            const assetId = balance.token.reference_id;
            const assetAccountSubscription = api.chainApi.query.Assets.Account
              .watchValue(Number(assetId), publicKey, "best")
              .subscribe(account => {
                if (account && Number(account.balance) > 0) {
                  const idx = balances.findIndex(t => t.id === balance.id);
                  if (idx >= 0) {
                    balances[idx] = {
                      ...balances[idx],
                      quantity: Number(account.balance),
                    };

                    subscriber.next([...balances]);
                  }
                }
              });

            subscriptions.push(assetAccountSubscription);
          }
        });
      })();

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }

  watchBalance(api: Api<XodePolkadot>, balance: Balance, publicKey: string): Observable<Balance> {
    return new Observable<Balance>(subscriber => {
      const subscriptions: any[] = [];

      if (balance.token.type === 'native') {
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
      } else {
        const assetId = balance.token.reference_id;
        const assetAccountSubscription = api.chainApi.query.Assets.Account
          .watchValue(Number(assetId), publicKey, "best")
          .subscribe(account => {
            if (account && Number(account.balance) > 0) {
              const newBalance: Balance = {
                id: balance.id,
                token: balance.token,
                quantity: Number(account.balance),
                price: 0,
                amount: 0,
              };

              subscriber.next(newBalance);
            }
          });

        subscriptions.push(assetAccountSubscription);
      }

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }

  async transfer(api: Api<XodePolkadot>, balance: Balance, destPublicKey: string, value: number): Promise<HexString> {
    const bigValue = BigInt(value);

    if (balance.token.type === 'native') {
      const transferExtrinsic = api.chainApi.tx.Balances.transfer_allow_death({
        dest: MultiAddress.Id(destPublicKey),
        value: bigValue,
      });

      return (await transferExtrinsic.getEncodedData()).asHex()
    }

    const transferExtrinsic = api.chainApi.tx.Assets.transfer_keep_alive({
      id: Number(balance.token.reference_id),
      target: MultiAddress.Id(destPublicKey),
      amount: bigValue,
    });

    return (await transferExtrinsic.getEncodedData()).asHex()
  }

  signAndSubmitTransaction(api: Api<XodePolkadot>, encodedCallDataHex: HexString, walletSigner: WalletSigner): Observable<TxEvent> {
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
