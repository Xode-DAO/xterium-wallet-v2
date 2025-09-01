import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { assethubPolkadot } from "@polkadot-api/descriptors"
import { createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/web';

import { Token, TokenPrices } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';

import { PolkadotApiService } from '../polkadot-api.service';

@Injectable({
  providedIn: 'root'
})
export class AssethubPolkadotService extends PolkadotApiService {
  protected wsProvider = "wss://polkadot-asset-hub-rpc.polkadot.io";

  protected client = createClient(getWsProvider(this.wsProvider));
  protected chainApi = this.client.getTypedApi(assethubPolkadot);

  async getTokens(): Promise<Token[]> {
    const assethubChainSpecs = this.client.getChainSpecData();

    const assethubChainName = (await assethubChainSpecs).name;
    const assethubTokenSymbol = (await assethubChainSpecs).properties['tokenSymbol'];
    const assethubTokenDecimals = (await assethubChainSpecs).properties['tokenDecimals'];
    const assethubTotalTokenSupply = Number(await this.chainApi.query.Balances.TotalIssuance.getValue({ at: "best" }))

    const tokens: Token[] = [];

    const nativeToken: Token = {
      id: uuidv4(),
      reference_id: 0,
      network_id: 1,
      name: assethubChainName,
      symbol: assethubTokenSymbol,
      decimals: assethubTokenDecimals,
      total_supply: assethubTotalTokenSupply,
      type: "native",
      image: ""
    }

    tokens.push(nativeToken);

    const assets = await this.chainApi.query.Assets.Asset.getEntries({ at: "best" });
    await Promise.all(
      assets.map(async (asset) => {
        const assetId = asset.keyArgs[0];
        if (!assetId) return;

        const metadata = await this.chainApi.query.Assets.Metadata.getValue(assetId, { at: "best" });
        const assetToken: Token = {
          id: uuidv4(),
          reference_id: assetId,
          network_id: 1,
          name: metadata.name.asText(),
          symbol: metadata.symbol.asText(),
          decimals: metadata.decimals,
          total_supply: Number(asset.value.supply),
          type: "asset",
          image: ""
        };

        tokens.push(assetToken);
      })
    );

    return tokens;
  }

  async getBalances(tokens: Token[], tokenPrices: TokenPrices[], publicKey: string): Promise<Balance[]> {
    const balances: Balance[] = [];

    if (tokens.length > 0) {
      const assetBalances: Balance[] = [];

      await Promise.all(
        tokens.map(async (token) => {
          let price = 0;
          if (tokenPrices.length > 0) {
            price = tokenPrices.find(p => p.token.symbol.toLowerCase() === token.symbol.toLowerCase())?.price || 0;
          }

          if (token.type === 'native') {
            const balanceAccount = await this.chainApi.query.System.Account.getValue(publicKey, { at: "best" });
            balances.push({
              id: uuidv4(),
              token,
              quantity: Number(balanceAccount.data.free),
              price,
              amount: Number(balanceAccount.data.free) * price,
            });
          } else {
            const assetId = token.reference_id;
            const account = await this.chainApi.query.Assets.Account.getValue(Number(assetId), publicKey, { at: "best" });
            const metadata = await this.chainApi.query.Assets.Metadata.getValue(Number(assetId), { at: "best" });

            if (account && metadata) {
              assetBalances.push({
                id: uuidv4(),
                token,
                quantity: Number(account.balance),
                price,
                amount: Number(account.balance) * price,
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

  watchTokens(): Observable<Token[]> {
    return new Observable<Token[]>(subscriber => {
      const subscriptions: any[] = [];
      const tokens: Token[] = [];

      (async () => {
        const assethubChainSpecs = this.client.getChainSpecData();

        const assethubChainName = (await assethubChainSpecs).name;
        const assethubTokenSymbol = (await assethubChainSpecs).properties['tokenSymbol'];
        const assethubTokenDecimals = (await assethubChainSpecs).properties['tokenDecimals'];
        const assethubTotalTokenSupply = Number(await this.chainApi.query.Balances.TotalIssuance.getValue({ at: "best" }))

        tokens.push({
          id: uuidv4(),
          reference_id: 0,
          network_id: 1,
          name: assethubChainName,
          symbol: assethubTokenSymbol,
          decimals: assethubTokenDecimals,
          total_supply: assethubTotalTokenSupply,
          type: "native",
          image: ""
        });

        subscriber.next([...tokens]);

        const totalIssuanceSub = this.chainApi.query.Balances.TotalIssuance
          .watchValue("best")
          .subscribe(totalIssuance => {
            const idx = tokens.findIndex(t => t.type === "native");
            if (idx >= 0) {
              tokens[idx] = {
                ...tokens[idx],
                total_supply: Number(totalIssuance)
              };

              subscriber.next([...tokens]);
            }
          });

        subscriptions.push(totalIssuanceSub);

        const assetsSubscription = this.chainApi.query.Assets.Asset
          .watchEntries({ at: "best" })
          .subscribe(async assets => {
            const assetList = await Promise.all(
              assets.entries.map(async entry => {
                const assetId = entry.args[0];
                if (!assetId) return null;

                const metadata = await this.chainApi.query.Assets.Metadata.getValue(assetId, { at: "best" });
                return <Token>{
                  id: uuidv4(),
                  reference_id: assetId,
                  network_id: 1,
                  name: metadata.name.asText(),
                  symbol: metadata.symbol.asText(),
                  decimals: metadata.decimals,
                  total_supply: Number(entry.value.supply),
                  type: "asset",
                  image: ""
                };
              })
            );

            const newAssets = assetList.filter((t): t is Token => !!t);

            const nativeOnly = tokens.filter(t => t.type === "native");
            tokens.splice(0, tokens.length, ...nativeOnly, ...newAssets);

            subscriber.next([...tokens]);

            newAssets.forEach(asset => {
              const metaSubscription = this.chainApi.query.Assets.Metadata
                .watchValue(Number(asset.reference_id), "best")
                .subscribe(metadata => {
                  const idx = tokens.findIndex(t => t.id === asset.id);
                  if (idx >= 0) {
                    tokens[idx] = {
                      ...tokens[idx],
                      name: metadata.name.asText(),
                      symbol: metadata.symbol.asText(),
                      decimals: metadata.decimals
                    };

                    subscriber.next([...tokens]);
                  }
                });

              subscriptions.push(metaSubscription);
            });
          });

        subscriptions.push(assetsSubscription);
      })();

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }

  watchBalances(tokens: Token[], tokenPrices: TokenPrices[], publicKey: string): Observable<Balance[]> {
    return new Observable<Balance[]>(subscriber => {
      const subscriptions: any[] = [];
      const balances: Balance[] = [];

      (async () => {
        const balanceList = await Promise.all(
          tokens.map(async token => {
            let price = 0;
            if (tokenPrices.length > 0) {
              price = tokenPrices.find(p => p.token.symbol.toLowerCase() === token.symbol.toLowerCase())?.price || 0;
            }

            if (token.type === 'native') {
              const balanceAccount = await this.chainApi.query.System.Account.getValue(publicKey, { at: "best" });
              return <Balance>{
                id: uuidv4(),
                token,
                quantity: Number(balanceAccount.data.free),
                price,
                amount: Number(balanceAccount.data.free) * price,
              };
            } else {
              const assetId = token.reference_id;

              const account = await this.chainApi.query.Assets.Account.getValue(Number(assetId), publicKey, { at: "best" });
              if (!account) return null;

              return <Balance>{
                id: uuidv4(),
                token,
                quantity: Number(account.balance),
                price,
                amount: Number(account.balance) * price,
              };
            }
          })
        );

        const newBalances = balanceList.filter((t): t is Balance => !!t);
        balances.splice(0, balances.length, ...newBalances);
        balances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id));

        subscriber.next([...balances]);

        newBalances.forEach(balance => {
          let price = 0;
          if (tokenPrices.length > 0) {
            price = tokenPrices.find(p => p.token.symbol.toLowerCase() === balance.token.symbol.toLowerCase())?.price || 0;
          }

          if (balance.token.type === 'native') {
            const systemAccountSubscription = this.chainApi.query.System.Account
              .watchValue(publicKey, "best")
              .subscribe(account => {
                const idx = balances.findIndex(t => t.id === balance.id);

                if (idx >= 0) {
                  balances[idx] = {
                    ...balances[idx],
                    quantity: Number(account.data.free),
                    price,
                    amount: Number(account.data.free) * price,
                  };

                  subscriber.next([...balances]);
                }
              });

            subscriptions.push(systemAccountSubscription);
          } else {
            const assetId = balance.token.reference_id;
            const assetAccountSubscription = this.chainApi.query.Assets.Account
              .watchValue(Number(assetId), publicKey, "best")
              .subscribe(account => {
                if (account && Number(account.balance) > 0) {
                  const idx = balances.findIndex(t => t.id === balance.id);
                  if (idx >= 0) {
                    balances[idx] = {
                      ...balances[idx],
                      quantity: Number(account.balance),
                      price,
                      amount: Number(account.balance) * price,
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

  watchBalance(balance: Balance, publicKey: string): Observable<Balance> {
    return new Observable<Balance>(subscriber => {
      const subscriptions: any[] = [];

      if (balance.token.type === 'native') {
        const systemAccountSubscription = this.chainApi.query.System.Account
          .watchValue(publicKey, "best")
          .subscribe(account => {
            const newBalance: Balance = {
              id: balance.id,
              token: balance.token,
              quantity: Number(account.data.free),
              price: balance.price,
              amount: Number(account.data.free) * balance.price,
            };

            subscriber.next(newBalance);
          });

        subscriptions.push(systemAccountSubscription);
      } else {
        const assetId = balance.token.reference_id;
        const assetAccountSubscription = this.chainApi.query.Assets.Account
          .watchValue(Number(assetId), publicKey, "best")
          .subscribe(account => {
            if (account && Number(account.balance) > 0) {
              const newBalance: Balance = {
                id: balance.id,
                token: balance.token,
                quantity: Number(account.balance),
                price: balance.price,
                amount: Number(account.balance) * balance.price,
              };

              subscriber.next(newBalance);
            }
          });

        subscriptions.push(assetAccountSubscription);
      }

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }
}
